import { google } from "googleapis";

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.SPREADSHEET_ID
  );
}

function client() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * 「2026年売上台帳」の該当月シートに 1 行追記する。
 * 月シートは
 *   日　付, 費目／内容, 金　額
 *   ...明細行...
 *   shop売上, 事業売上        ← ある場合
 *   合　計　金　額, =SUM(...)
 * という構成なので、「shop売上」行（無ければ「合計」行）の直前に行を挿入する。
 */
export async function appendSaleRow(params: {
  date: Date;
  eventName: string;
  amount: number;
}): Promise<{ sheetTitle: string; rowNumber: number }> {
  const spreadsheetId = process.env.SPREADSHEET_ID!;
  const sheets = client();

  const month = params.date.getUTCMonth() + 1;
  const day = params.date.getUTCDate();
  const sheetTitle = `${month}月`;

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title?.trim() === sheetTitle
  );
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`シート「${sheetTitle}」が見つかりません`);
  }
  const sheetId = sheet.properties.sheetId!;

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:A200`,
  });
  const colA = (values.data.values || []).map((r) => String(r?.[0] ?? ""));

  const normalize = (s: string) => s.replace(/[\s　]/g, "");
  let insertBefore = colA.findIndex((v) => normalize(v) === "shop売上");
  if (insertBefore === -1) {
    insertBefore = colA.findIndex((v) => normalize(v).startsWith("合計"));
  }
  if (insertBefore === -1) {
    insertBefore = colA.length; // 見つからなければ末尾に追加
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: insertBefore,
              endIndex: insertBefore + 1,
            },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  const rowNumber = insertBefore + 1; // 1始まり
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${rowNumber}:C${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[`${month}/${day}`, params.eventName, params.amount]],
    },
  });

  return { sheetTitle, rowNumber };
}

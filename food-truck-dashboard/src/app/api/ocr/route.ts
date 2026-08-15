import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// レジの精算レシート3種を自動判別して構造化データを抽出する
const RECEIPT_TOOL: Anthropic.Tool = {
  name: "record_receipt",
  description: "レシート画像から読み取った内容を構造化して記録する",
  input_schema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["daily", "plu", "hourly", "other"],
        description:
          "レシート種別。daily=日計明細（総売・純売・現金・PayPay等の集計）、plu=商品別の点数と金額の内訳、hourly=時間帯別の件数と金額、other=判別不能",
      },
      products: {
        type: "array",
        description: "商品別の売上（daily・pluで商品行がある場合）",
        items: {
          type: "object",
          properties: {
            productName: { type: "string", description: "商品名（例: ぶたころ、ぷれーん）" },
            quantity: { type: "integer", description: "点数" },
            amount: { type: "integer", description: "金額（円）" },
          },
          required: ["productName", "quantity", "amount"],
        },
      },
      hourly: {
        type: "array",
        description: "時間帯別売上（hourlyの場合）",
        items: {
          type: "object",
          properties: {
            hourStart: { type: "string", description: "開始時刻 HH:MM（例: 09:00）" },
            count: { type: "integer", description: "件数" },
            amount: { type: "integer", description: "金額（円）" },
          },
          required: ["hourStart", "count", "amount"],
        },
      },
      totals: {
        type: "object",
        description: "集計値（読み取れたものだけ）",
        properties: {
          gross: { type: "integer", description: "総売（円）" },
          net: { type: "integer", description: "純売（円）" },
          cash: { type: "integer", description: "現金（円）" },
          paypay: { type: "integer", description: "PAYPAY（円）" },
          totalCount: { type: "integer", description: "合計件数または点数" },
          totalAmount: { type: "integer", description: "合計金額（円）" },
        },
      },
      settledAt: {
        type: "string",
        description: "精算日時（例: 2026-07-20 16:04）。読み取れなければ省略",
      },
      note: {
        type: "string",
        description: "読み取りに自信がない箇所や補足",
      },
    },
    required: ["kind"],
  },
};

// 会場に出ていた他社キッチンカーを写真から拾い出す
const COMPETITOR_TOOL: Anthropic.Tool = {
  name: "record_competitors",
  description: "写真に写っているキッチンカー（競合店舗）を列挙して記録する",
  input_schema: {
    type: "object",
    properties: {
      competitors: {
        type: "array",
        description:
          "写真から読み取れた店舗の一覧。1枚に複数台写っていれば全部入れる。1台も判別できなければ空配列",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "店名（看板・のぼり・車体に書かれている屋号）",
            },
            genre: {
              type: "string",
              description: "ジャンル（例: 焼きそば、クレープ、カレー、から揚げ、ドリンク）",
            },
            mainProduct: {
              type: "string",
              description: "主力商品・一番目立つメニュー名",
            },
            price: {
              type: "integer",
              description: "その主力商品の価格（円）。読み取れなければ省略",
            },
            crowdLevel: {
              type: "string",
              enum: ["空いてる", "ふつう", "混雑", "行列"],
              description: "写真から見て取れる混雑度。判断できなければ省略",
            },
            memo: {
              type: "string",
              description: "気づいたこと（内装の雰囲気、のぼりの数、セット販売など）",
            },
          },
          required: ["name"],
        },
      },
      note: {
        type: "string",
        description: "読み取りに自信がない箇所や補足",
      },
    },
    required: ["competitors"],
  },
};

const RECEIPT_PROMPT = [
  "これはキッチンカー（おむすび屋）のレジ精算レシート（御計算書）の写真です。",
  "内容を読み取り、record_receipt ツールで記録してください。",
  "・「日計明細」（総売/純売/現金/PAYPAY などの集計）なら kind=daily。商品行があれば products にも入れる",
  "・「PLU」（商品別の点数・金額のみ）なら kind=plu",
  "・「時間帯」（09:00-10:00 のような行）なら kind=hourly。hourStart は開始時刻のみ",
  "・金額は円の整数。カンマや¥記号は除く",
  "・読み取れない値は入れない（推測で埋めない）",
].join("\n");

const COMPETITOR_PROMPT = [
  "これはイベント会場に出店している他社キッチンカーの写真です。",
  "写っている店舗を読み取り、record_competitors ツールで記録してください。",
  "・看板・のぼり・車体・メニュー表から読み取れる店舗を**すべて**列挙する（1枚に複数台写っていれば全部）",
  "・店名が読み取れない車両は含めない。1台も判別できなければ competitors は空配列にする",
  "・価格は円の整数。カンマや¥記号は除く",
  "・写真から判断できない項目は入れない（推測で埋めない）",
  "・memo には行列の長さ、のぼりの数、セット販売など、振り返りに役立つ気づきを短く書く",
].join("\n");

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const { image, mode } = (await request.json()) as {
    image?: string;
    mode?: "receipt" | "competitor";
  };
  if (!image?.startsWith("data:")) {
    return NextResponse.json(
      { error: "image（data URL）を送信してください" },
      { status: 400 }
    );
  }
  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !MEDIA_TYPES.includes(match[1] as MediaType)) {
    return NextResponse.json(
      { error: "対応していない画像形式です" },
      { status: 400 }
    );
  }

  const isCompetitor = mode === "competitor";
  const tool = isCompetitor ? COMPETITOR_TOOL : RECEIPT_TOOL;
  const prompt = isCompetitor ? COMPETITOR_PROMPT : RECEIPT_PROMPT;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: match[1] as MediaType,
              data: match[2],
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    return NextResponse.json(
      {
        error: isCompetitor
          ? "写真から店舗を読み取れませんでした"
          : "レシートを読み取れませんでした",
      },
      { status: 422 }
    );
  }
  return NextResponse.json(toolUse.input);
}

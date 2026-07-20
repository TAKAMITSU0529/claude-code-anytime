import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// レジの精算レシート3種を自動判別して構造化データを抽出する
const EXTRACT_TOOL: Anthropic.Tool = {
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

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const { image } = (await request.json()) as { image?: string };
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

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "record_receipt" },
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
          {
            type: "text",
            text: [
              "これはキッチンカー（おむすび屋）のレジ精算レシート（御計算書）の写真です。",
              "内容を読み取り、record_receipt ツールで記録してください。",
              "・「日計明細」（総売/純売/現金/PAYPAY などの集計）なら kind=daily。商品行があれば products にも入れる",
              "・「PLU」（商品別の点数・金額のみ）なら kind=plu",
              "・「時間帯」（09:00-10:00 のような行）なら kind=hourly。hourStart は開始時刻のみ",
              "・金額は円の整数。カンマや¥記号は除く",
              "・読み取れない値は入れない（推測で埋めない）",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    return NextResponse.json(
      { error: "レシートを読み取れませんでした" },
      { status: 422 }
    );
  }
  return NextResponse.json(toolUse.input);
}

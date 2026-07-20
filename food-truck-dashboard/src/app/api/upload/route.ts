import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const maxDuration = 30;

// クライアント側で縮小済みのJPEG（data URL）を受け取り、
// Vercel Blob があればそこへ、無ければ data URL のままDBに保存させる
export async function POST(request: NextRequest) {
  const { image, filename } = (await request.json()) as {
    image?: string;
    filename?: string;
  };
  if (!image?.startsWith("data:")) {
    return NextResponse.json(
      { error: "image（data URL）を送信してください" },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ url: image, storage: "inline" });
  }

  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "不正な画像データです" }, { status: 400 });
  }
  const buffer = Buffer.from(match[2], "base64");
  const ext = match[1] === "image/png" ? "png" : "jpg";
  const blob = await put(
    `receipts/${Date.now()}-${(filename || "receipt").replace(/[^\w.-]/g, "_")}.${ext}`,
    buffer,
    { access: "public", contentType: match[1] }
  );
  return NextResponse.json({ url: blob.url, storage: "blob" });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { summarizeHighlight } from "@/lib/summarize";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const highlight = await prisma.highlight.findUnique({ where: { id } });

  if (!highlight) {
    return NextResponse.json({ error: "ハイライトが見つかりません" }, { status: 404 });
  }

  const summary = await summarizeHighlight(highlight.content);
  if (!summary) {
    return NextResponse.json(
      { error: "要約の生成に失敗しました。APIキーを確認してください。" },
      { status: 500 }
    );
  }

  const updated = await prisma.highlight.update({
    where: { id },
    data: { summary },
  });

  return NextResponse.json(updated);
}

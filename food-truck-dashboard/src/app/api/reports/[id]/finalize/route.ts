import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendSaleRow, sheetsConfigured } from "@/lib/sheets";

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

// 確定処理: ステータスを final にし、売上台帳スプレッドシートへ行追記する
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const report = await prisma.eventReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  if (report.sheetSyncedAt) {
    return NextResponse.json({
      ok: true,
      alreadySynced: true,
      message: "すでに売上台帳へ反映済みです",
    });
  }

  if (!sheetsConfigured()) {
    await prisma.eventReport.update({
      where: { id },
      data: { status: "final" },
    });
    return NextResponse.json({
      ok: true,
      synced: false,
      message:
        "確定しました（Googleスプレッドシート連携が未設定のため台帳への追記はスキップ）",
    });
  }

  try {
    const result = await appendSaleRow({
      date: report.date,
      eventName: report.eventName,
      amount: report.totalSales,
    });
    await prisma.eventReport.update({
      where: { id },
      data: { status: "final", sheetSyncedAt: new Date() },
    });
    return NextResponse.json({
      ok: true,
      synced: true,
      message: `売上台帳「${result.sheetTitle}」の${result.rowNumber}行目に追記しました`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `台帳への反映に失敗しました: ${message}` },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nestedCreates, toReportData, type ReportInput } from "@/lib/report-input";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const report = await prisma.eventReport.findUnique({
    where: { id },
    include: {
      prepItems: { orderBy: { sortOrder: "asc" } },
      productSales: { orderBy: { sortOrder: "asc" } },
      hourlySales: { orderBy: { hourStart: "asc" } },
      receiptImages: true,
      competitors: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!report) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  return NextResponse.json(report);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const input = (await request.json()) as ReportInput;
  const existing = await prisma.eventReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }
  const report = await prisma.$transaction(async (tx) => {
    await tx.prepItem.deleteMany({ where: { reportId: id } });
    await tx.productSale.deleteMany({ where: { reportId: id } });
    await tx.hourlySale.deleteMany({ where: { reportId: id } });
    await tx.receiptImage.deleteMany({ where: { reportId: id } });
    await tx.competitor.deleteMany({ where: { reportId: id } });
    return tx.eventReport.update({
      where: { id },
      data: { ...toReportData(input), ...nestedCreates(input) },
      include: {
        prepItems: true,
        productSales: true,
        hourlySales: true,
        receiptImages: true,
        competitors: true,
      },
    });
  });
  return NextResponse.json(report);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.eventReport.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

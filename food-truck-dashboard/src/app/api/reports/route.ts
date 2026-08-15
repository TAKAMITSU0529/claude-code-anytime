import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nestedCreates, toReportData, type ReportInput } from "@/lib/report-input";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month"); // "2026-07"
  let where = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where = {
      date: {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lt: new Date(Date.UTC(y, m, 1)),
      },
    };
  }
  const reports = await prisma.eventReport.findMany({
    where,
    orderBy: { date: "desc" },
    include: { productSales: true, hourlySales: true },
  });
  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as ReportInput;
  if (!input.date) {
    return NextResponse.json({ error: "日付は必須です" }, { status: 400 });
  }
  const report = await prisma.eventReport.create({
    data: { ...toReportData(input), ...nestedCreates(input) },
    include: {
      prepItems: true,
      productSales: true,
      hourlySales: true,
      receiptImages: true,
      competitors: true,
    },
  });
  return NextResponse.json(report, { status: 201 });
}

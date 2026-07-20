import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReportForm } from "@/components/ReportForm";
import type { CashBreakdown } from "@/lib/calc";

export const dynamic = "force-dynamic";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.eventReport.findUnique({
    where: { id },
    include: {
      prepItems: { orderBy: { sortOrder: "asc" } },
      productSales: { orderBy: { sortOrder: "asc" } },
      hourlySales: { orderBy: { hourStart: "asc" } },
      receiptImages: true,
    },
  });
  if (!report) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">売上報告を編集</h1>
      <ReportForm
        initial={{
          id: report.id,
          date: report.date.toISOString(),
          eventName: report.eventName,
          weather: report.weather,
          staff: report.staff,
          genkinBreakdown: (report.genkinBreakdown ?? {}) as CashBreakdown,
          salesCashBreakdown: (report.salesCashBreakdown ?? {}) as CashBreakdown,
          paypayAmount: report.paypayAmount,
          registerGross: report.registerGross,
          registerNet: report.registerNet,
          stallFee: report.stallFee,
          kanso: report.kanso,
          hansei: report.hansei,
          kaizen: report.kaizen,
          shortages: report.shortages,
          prepItems: report.prepItems.map((p) => ({
            name: p.name,
            unit: p.unit,
            qtyTaken: p.qtyTaken,
            qtyReturned: p.qtyReturned,
          })),
          productSales: report.productSales.map((p) => ({
            productName: p.productName,
            quantity: p.quantity,
            amount: p.amount,
          })),
          hourlySales: report.hourlySales.map((h) => ({
            hourStart: h.hourStart,
            count: h.count,
            amount: h.amount,
          })),
          receiptImages: report.receiptImages.map((r) => ({
            kind: r.kind,
            url: r.url,
          })),
        }}
      />
    </div>
  );
}

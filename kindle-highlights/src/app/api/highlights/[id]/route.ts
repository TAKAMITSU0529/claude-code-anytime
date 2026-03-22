import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const highlight = await prisma.highlight.update({
    where: { id },
    data: {
      ...(body.memo !== undefined && { memo: body.memo }),
    },
  });

  return NextResponse.json(highlight);
}

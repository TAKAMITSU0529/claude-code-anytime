import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      highlights: { orderBy: { highlightedAt: "asc" } },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "書籍が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(book);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const book = await prisma.book.update({
    where: { id },
    data: {
      ...(body.genre !== undefined && { genre: body.genre }),
      ...(body.title !== undefined && { title: body.title }),
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ message: "削除しました" });
}

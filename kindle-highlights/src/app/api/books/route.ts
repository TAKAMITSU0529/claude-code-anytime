import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "createdAt";

  const where: Record<string, unknown> = {};
  if (genre) where.genre = genre;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === "title"
      ? { title: "asc" }
      : sort === "highlights"
        ? { createdAt: "desc" }
        : { createdAt: "desc" };

  const books = await prisma.book.findMany({
    where,
    orderBy,
    include: { _count: { select: { highlights: true } } },
  });

  return NextResponse.json(books);
}

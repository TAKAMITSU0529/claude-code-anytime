import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseClippings } from "@/lib/clippings-parser";
import { fetchCoverImage } from "@/lib/google-books";
import { summarizeHighlight } from "@/lib/summarize";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    const text = await file.text();
    const highlights = parseClippings(text);

    if (highlights.length === 0) {
      return NextResponse.json({ error: "ハイライトが見つかりませんでした" }, { status: 400 });
    }

    // Group highlights by book
    const bookMap = new Map<string, typeof highlights>();
    for (const h of highlights) {
      const key = `${h.title}::${h.author}`;
      if (!bookMap.has(key)) bookMap.set(key, []);
      bookMap.get(key)!.push(h);
    }

    let importedBooks = 0;
    let importedHighlights = 0;

    for (const [key, bookHighlights] of bookMap) {
      const [title, author] = key.split("::");

      // Find or create book
      let book = await prisma.book.findFirst({ where: { title, author } });

      if (!book) {
        const coverImageUrl = await fetchCoverImage(title, author);
        book = await prisma.book.create({
          data: { title, author, coverImageUrl },
        });
        importedBooks++;
      }

      // Import highlights (skip duplicates)
      for (const h of bookHighlights) {
        const exists = await prisma.highlight.findFirst({
          where: { bookId: book.id, content: h.content },
        });
        if (exists) continue;

        // Generate summary asynchronously (non-blocking)
        const summary = await summarizeHighlight(h.content);

        await prisma.highlight.create({
          data: {
            bookId: book.id,
            content: h.content,
            summary,
            location: h.location,
            highlightedAt: h.highlightedAt,
          },
        });
        importedHighlights++;
      }
    }

    return NextResponse.json({
      message: "インポート完了",
      importedBooks,
      importedHighlights,
      totalParsed: highlights.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "インポート中にエラーが発生しました" }, { status: 500 });
  }
}

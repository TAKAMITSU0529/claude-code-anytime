import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCoverImage } from "@/lib/google-books";

export async function POST(req: NextRequest) {
  try {
    const { text, bookTitle, bookAuthor } = await req.json();

    if (!text || !bookTitle) {
      return NextResponse.json(
        { error: "テキストと本のタイトルは必須です" },
        { status: 400 }
      );
    }

    // Parse pasted text into individual highlights
    // Each non-empty line is treated as a separate highlight
    // Also handle cases where highlights are separated by blank lines
    const highlights = splitIntoHighlights(text);

    if (highlights.length === 0) {
      return NextResponse.json(
        { error: "ハイライトが見つかりませんでした" },
        { status: 400 }
      );
    }

    // Find or create book
    let book = await prisma.book.findFirst({
      where: { title: bookTitle, author: bookAuthor },
    });

    let importedBooks = 0;
    if (!book) {
      const coverImageUrl = await fetchCoverImage(bookTitle, bookAuthor);
      book = await prisma.book.create({
        data: { title: bookTitle, author: bookAuthor, coverImageUrl },
      });
      importedBooks = 1;
    }

    // Import highlights (skip duplicates)
    let importedHighlights = 0;
    for (const content of highlights) {
      const exists = await prisma.highlight.findFirst({
        where: { bookId: book.id, content },
      });
      if (exists) continue;

      await prisma.highlight.create({
        data: {
          bookId: book.id,
          content,
        },
      });
      importedHighlights++;
    }

    return NextResponse.json({
      message: "インポート完了",
      importedBooks,
      importedHighlights,
      totalParsed: highlights.length,
    });
  } catch (error) {
    console.error("Paste import error:", error);
    return NextResponse.json(
      { error: "インポート中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

function splitIntoHighlights(text: string): string[] {
  const lines = text.split("\n");
  const highlights: string[] = [];
  let current = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip common Kindle notebook UI text
    if (isKindleMetadata(trimmed)) continue;

    if (trimmed === "") {
      // Blank line = separator between highlights
      if (current.trim()) {
        highlights.push(current.trim());
        current = "";
      }
    } else {
      // Append to current highlight
      if (current) current += "\n";
      current += trimmed;
    }
  }

  // Don't forget the last one
  if (current.trim()) {
    highlights.push(current.trim());
  }

  return highlights;
}

function isKindleMetadata(line: string): boolean {
  // Filter out common Kindle notebook page elements that get copied
  if (!line) return true;
  if (line.startsWith("ハイライト(") || line.startsWith("メモ(")) return true;
  if (line.startsWith("Highlight(") || line.startsWith("Note(")) return true;
  if (/^(イエロー|ブルー|ピンク|オレンジ)\s*[>|｜]/.test(line)) return true;
  if (/^(Yellow|Blue|Pink|Orange)\s*[>|｜]/i.test(line)) return true;
  if (/^位置[:：]\s*\d+/.test(line)) return true;
  if (/^Location[:：]\s*\d+/i.test(line)) return true;
  if (/^ページ[:：]\s*\d+/.test(line)) return true;
  if (/^Page[:：]\s*\d+/i.test(line)) return true;
  // "Read more at location X" type links
  if (/^読み続ける/.test(line)) return true;
  if (/^Read more/i.test(line)) return true;
  return false;
}

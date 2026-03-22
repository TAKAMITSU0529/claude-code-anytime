import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchKindleHighlights } from "@/lib/kindle-sync";
import { fetchCoverImage } from "@/lib/google-books";

export async function POST() {
  try {
    // Get saved Amazon cookie
    const setting = await prisma.notificationSetting.findFirst();
    if (!setting?.amazonCookie) {
      return NextResponse.json(
        { error: "Amazon Cookieが設定されていません。設定画面から登録してください。" },
        { status: 400 }
      );
    }

    let kindleBooks;
    try {
      kindleBooks = await fetchKindleHighlights(setting.amazonCookie);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "COOKIE_EXPIRED") {
        return NextResponse.json(
          {
            error:
              "Amazonのセッションが切れています。設定画面からCookieを再取得してください。",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Amazonへの接続に失敗しました: ${message}` },
        { status: 502 }
      );
    }

    if (kindleBooks.length === 0) {
      return NextResponse.json(
        { error: "Kindleのハイライトが見つかりませんでした。" },
        { status: 404 }
      );
    }

    let importedBooks = 0;
    let importedHighlights = 0;
    let skippedHighlights = 0;

    for (const kb of kindleBooks) {
      // Find or create book
      let book = await prisma.book.findFirst({
        where: { title: kb.title, author: kb.author },
      });

      if (!book) {
        const coverImageUrl = await fetchCoverImage(kb.title, kb.author);
        book = await prisma.book.create({
          data: { title: kb.title, author: kb.author, coverImageUrl },
        });
        importedBooks++;
      }

      // Import highlights (skip duplicates)
      for (const h of kb.highlights) {
        const exists = await prisma.highlight.findFirst({
          where: { bookId: book.id, content: h.content },
        });
        if (exists) {
          skippedHighlights++;
          continue;
        }

        await prisma.highlight.create({
          data: {
            bookId: book.id,
            content: h.content,
            location: h.location,
          },
        });
        importedHighlights++;
      }
    }

    return NextResponse.json({
      message: "同期完了",
      totalBooks: kindleBooks.length,
      importedBooks,
      importedHighlights,
      skippedHighlights,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "同期中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";

export async function POST() {
  const setting = await prisma.notificationSetting.findFirst();
  if (!setting || !setting.webhookUrl) {
    return NextResponse.json(
      { error: "Discord Webhook URLが設定されていません" },
      { status: 400 }
    );
  }

  const highlights = await prisma.highlight.findMany({
    include: { book: true },
    take: 20,
  });

  if (highlights.length === 0) {
    return NextResponse.json(
      { error: "ハイライトがありません。まず本をインポートしてください。" },
      { status: 400 }
    );
  }

  const shuffled = highlights.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(setting.highlightCount, highlights.length));

  const success = await sendDiscordNotification(
    setting.webhookUrl,
    selected.map((h) => ({
      bookTitle: h.book.title,
      author: h.book.author,
      content: h.content,
      summary: h.summary,
    }))
  );

  if (!success) {
    return NextResponse.json({ error: "通知の送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ message: "テスト通知を送信しました" });
}

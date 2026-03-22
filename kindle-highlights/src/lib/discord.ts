interface HighlightNotification {
  bookTitle: string;
  author: string;
  content: string;
  summary: string | null;
}

export async function sendDiscordNotification(
  webhookUrl: string,
  highlights: HighlightNotification[]
): Promise<boolean> {
  const embeds = highlights.map((h) => ({
    title: h.bookTitle,
    description: h.content.length > 300 ? h.content.slice(0, 300) + "..." : h.content,
    fields: [
      ...(h.summary ? [{ name: "AI要約", value: h.summary, inline: false }] : []),
      { name: "著者", value: h.author, inline: true },
    ],
    color: 0x4a90d9,
  }));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Kindle Highlights",
        content: "📚 今日の復習ハイライト",
        embeds,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

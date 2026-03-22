import cron from "node-cron";
import { prisma } from "./prisma";
import { sendDiscordNotification } from "./discord";

export function startScheduler() {
  // Check every minute if we need to send notifications
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const settings = await prisma.notificationSetting.findMany({
      where: { isEnabled: true },
    });

    for (const setting of settings) {
      const times: string[] = JSON.parse(setting.scheduleTimes);
      if (!times.includes(currentTime)) continue;

      const count = setting.highlightCount;
      const highlights = await prisma.highlight.findMany({
        include: { book: true },
      });

      if (highlights.length === 0) continue;

      // Pick random highlights
      const shuffled = highlights.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      await sendDiscordNotification(
        setting.webhookUrl,
        selected.map((h) => ({
          bookTitle: h.book.title,
          author: h.book.author,
          content: h.content,
          summary: h.summary,
        }))
      );
    }
  });
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let setting = await prisma.notificationSetting.findFirst();
  if (!setting) {
    setting = await prisma.notificationSetting.create({
      data: {
        webhookUrl: "",
        scheduleTimes: '["07:00"]',
        isEnabled: false,
        highlightCount: 3,
      },
    });
  }
  return NextResponse.json(setting);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  let setting = await prisma.notificationSetting.findFirst();

  const data: Record<string, unknown> = {};
  if (body.webhookUrl !== undefined) data.webhookUrl = body.webhookUrl;
  if (body.scheduleTimes !== undefined) data.scheduleTimes = JSON.stringify(body.scheduleTimes);
  if (body.isEnabled !== undefined) data.isEnabled = body.isEnabled;
  if (body.highlightCount !== undefined) data.highlightCount = body.highlightCount;
  if (body.amazonCookie !== undefined) data.amazonCookie = body.amazonCookie;

  if (setting) {
    setting = await prisma.notificationSetting.update({
      where: { id: setting.id },
      data,
    });
  } else {
    setting = await prisma.notificationSetting.create({
      data: {
        webhookUrl: body.webhookUrl ?? "",
        scheduleTimes: JSON.stringify(body.scheduleTimes ?? ["07:00"]),
        isEnabled: body.isEnabled ?? false,
        highlightCount: body.highlightCount ?? 3,
        amazonCookie: body.amazonCookie ?? null,
      },
    });
  }

  return NextResponse.json(setting);
}

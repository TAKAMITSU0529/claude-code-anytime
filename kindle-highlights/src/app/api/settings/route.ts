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

  if (setting) {
    setting = await prisma.notificationSetting.update({
      where: { id: setting.id },
      data: {
        webhookUrl: body.webhookUrl,
        scheduleTimes: JSON.stringify(body.scheduleTimes),
        isEnabled: body.isEnabled,
        highlightCount: body.highlightCount,
      },
    });
  } else {
    setting = await prisma.notificationSetting.create({
      data: {
        webhookUrl: body.webhookUrl,
        scheduleTimes: JSON.stringify(body.scheduleTimes),
        isEnabled: body.isEnabled,
        highlightCount: body.highlightCount,
      },
    });
  }

  return NextResponse.json(setting);
}

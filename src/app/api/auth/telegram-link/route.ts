import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateLinkCode } from "@/lib/telegram";

export async function POST() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const botConfigured = token && token !== "ВСТАВЬТЕ_ТОКЕН_СЮДА";

  const code = generateLinkCode();

  await prisma.user.update({
    where: { id: current.id },
    data: { linkCode: code },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const botUrl = botUsername ? `https://t.me/${botUsername}?start=${code}` : null;

  return NextResponse.json({
    linkCode: code,
    botUrl,
    botConfigured,
  });
}

export async function DELETE() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  await prisma.user.update({
    where: { id: current.id },
    data: {
      telegramChatId: null,
      telegramLinked: false,
      twoFAEnabled: false,
    },
  });

  return NextResponse.json({ ok: true });
}

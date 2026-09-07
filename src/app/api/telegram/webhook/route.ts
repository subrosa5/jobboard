import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

// Заменяет src/bot.ts (polling — несовместим с serverless) на webhook,
// который Telegram сам дёргает при каждом сообщении. Логика /start и
// /start <linkCode> — та же, что в bot.ts, просто без node-telegram-bot-api
// и без постоянно работающего процесса.

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

export async function POST(req: NextRequest) {
  // Секрет, который Telegram присылает в заголовке при регистрации через
  // setWebhook?secret_token=... — отсекает чужие запросы на этот роут.
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update: TelegramUpdate = await req.json();
  const text = update.message?.text?.trim();
  const chatId = update.message?.chat.id;

  if (!chatId || !text?.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const linkCode = text.slice("/start".length).trim();

  if (linkCode) {
    const user = await prisma.user.findUnique({ where: { linkCode } });

    if (!user) {
      await sendTelegramMessage(
        String(chatId),
        "❌ Код недействителен или уже использован. Получите новый код в личном кабинете."
      );
      return NextResponse.json({ ok: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(chatId), telegramLinked: true, linkCode: null },
    });

    await sendTelegramMessage(
      String(chatId),
      `✅ Telegram успешно привязан к аккаунту *${user.name}*!\n\nТеперь при входе на сайт вы будете получать код подтверждения сюда.`
    );
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });

  if (existing) {
    await sendTelegramMessage(
      String(chatId),
      `👋 Привет, *${existing.name}*! Ваш Telegram уже привязан к аккаунту JobBoard.\n\nПри входе на сайт коды подтверждения будут приходить сюда.`
    );
  } else {
    await sendTelegramMessage(
      String(chatId),
      "👋 Добро пожаловать в JobBoard!\n\nЧтобы привязать Telegram к вашему аккаунту:\n1. Войдите на сайт\n2. Перейдите в *Личный кабинет*\n3. Нажмите *Подключить Telegram*\n4. Следуйте инструкциям"
    );
  }

  return NextResponse.json({ ok: true });
}

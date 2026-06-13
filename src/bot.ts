import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN!;

if (!token || token === "ВСТАВЬТЕ_ТОКЕН_СЮДА") {
  console.error("❌ Укажите TELEGRAM_BOT_TOKEN в файле .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram бот запущен...");

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const linkCode = match?.[1]?.trim();

  if (!linkCode) return;

  const user = await prisma.user.findUnique({ where: { linkCode } });

  if (!user) {
    await bot.sendMessage(chatId, "❌ Код недействителен или уже использован. Получите новый код в личном кабинете.");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: String(chatId),
      telegramLinked: true,
      linkCode: null,
    },
  });

  await bot.sendMessage(
    chatId,
    `✅ Telegram успешно привязан к аккаунту *${user.name}*!\n\nТеперь при входе на сайт вы будете получать код подтверждения сюда.`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const existing = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });

  if (existing) {
    await bot.sendMessage(
      chatId,
      `👋 Привет, *${existing.name}*! Ваш Telegram уже привязан к аккаунту JobBoard.\n\nПри входе на сайт коды подтверждения будут приходить сюда.`,
      { parse_mode: "Markdown" }
    );
  } else {
    await bot.sendMessage(
      chatId,
      `👋 Добро пожаловать в JobBoard!\n\nЧтобы привязать Telegram к вашему аккаунту:\n1. Войдите на сайт\n2. Перейдите в *Личный кабинет*\n3. Нажмите *Подключить Telegram*\n4. Следуйте инструкциям`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.on("polling_error", (err) => {
  console.error("Bot polling error:", err.message);
});

process.on("SIGINT", async () => {
  console.log("Stopping bot...");
  await bot.stopPolling();
  await prisma.$disconnect();
  process.exit(0);
});

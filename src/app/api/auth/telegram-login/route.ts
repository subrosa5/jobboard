import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "ВСТАВЬТЕ_ТОКЕН_СЮДА") return false;

  const { hash, ...fields } = data;
  const secretKey = crypto.createHash("sha256").update(token).digest();

  const dataCheckString = Object.keys(fields)
    .sort()
    .filter((k) => fields[k as keyof typeof fields] !== undefined)
    .map((k) => `${k}=${fields[k as keyof typeof fields]}`)
    .join("\n");

  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return hmac === hash;
}

export async function POST(req: NextRequest) {
  const data: TelegramAuthData = await req.json();

  if (!verifyTelegramAuth(data)) {
    return NextResponse.json({ error: "Неверная подпись Telegram" }, { status: 401 });
  }

  // Проверка свежести данных (не старше 1 дня)
  if (Date.now() / 1000 - data.auth_date > 86400) {
    return NextResponse.json({ error: "Данные устарели, войдите снова" }, { status: 401 });
  }

  const telegramId = String(data.id);
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ");

  // Ищем существующего пользователя по telegramChatId
  let user = await prisma.user.findFirst({ where: { telegramChatId: telegramId } });

  if (!user) {
    // Создаём нового пользователя автоматически
    const email = `tg_${telegramId}@jobboard.local`;
    user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: "",
        role: "SEEKER",
        telegramChatId: telegramId,
        telegramLinked: true,
      },
    });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}

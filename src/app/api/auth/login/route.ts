import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { sendTelegramMessage, generateOTP } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  // 2FA через Telegram
  if (user.twoFAEnabled && user.telegramChatId) {
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry: expiry },
    });

    await sendTelegramMessage(
      user.telegramChatId,
      `🔐 *Код входа на JobBoard*\n\nКод: \`${otp}\`\n\nДействует 5 минут. Не передавайте его никому.`
    );

    return NextResponse.json({ requireOTP: true, userId: user.id });
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

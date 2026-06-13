import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, otp } = await req.json();

  if (!userId || !otp) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.otpCode || !user.otpExpiry) {
    return NextResponse.json({ error: "Код не найден. Попробуйте войти снова." }, { status: 400 });
  }

  if (new Date() > user.otpExpiry) {
    await prisma.user.update({ where: { id: userId }, data: { otpCode: null, otpExpiry: null } });
    return NextResponse.json({ error: "Код истёк. Войдите снова." }, { status: 400 });
  }

  if (user.otpCode !== otp.trim()) {
    return NextResponse.json({ error: "Неверный код" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: userId }, data: { otpCode: null, otpExpiry: null } });

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

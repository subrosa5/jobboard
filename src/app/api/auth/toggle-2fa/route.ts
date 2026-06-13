import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: current.id } });
  if (!user?.telegramLinked) {
    return NextResponse.json({ error: "Сначала привяжите Telegram" }, { status: 400 });
  }

  const { enabled } = await req.json();
  await prisma.user.update({
    where: { id: current.id },
    data: { twoFAEnabled: enabled },
  });

  return NextResponse.json({ ok: true, twoFAEnabled: enabled });
}

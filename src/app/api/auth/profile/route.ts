import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      telegramLinked: true,
      twoFAEnabled: true,
    },
  });

  return NextResponse.json({ user });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { status } = await req.json();
  const app = await prisma.application.findUnique({
    where: { id },
    include: { vacancy: true },
  });
  if (!app) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (app.vacancy.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  const updated = await prisma.application.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } }, _count: { select: { applications: true } } },
  });
  if (!vacancy) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(vacancy);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (vacancy.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  const data = await req.json();
  const updated = await prisma.vacancy.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (vacancy.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  await prisma.vacancy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

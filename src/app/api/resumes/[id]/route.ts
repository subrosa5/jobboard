import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  if (!resume) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(resume);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (resume.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  const { title, summary, skills, experience, education, salary, city, isPublished } = await req.json();
  const updated = await prisma.resume.update({
    where: { id },
    data: {
      title,
      summary,
      skills: skills !== undefined ? JSON.stringify(skills) : undefined,
      experience: experience !== undefined ? JSON.stringify(experience) : undefined,
      education,
      salary: salary !== undefined ? (salary ? parseInt(salary) : null) : undefined,
      city,
      isPublished,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  if (resume.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vacancyId = searchParams.get("vacancyId");

  if (user.role === "EMPLOYER") {
    const where = vacancyId
      ? { vacancyId }
      : { vacancy: { userId: user.id } };
    const apps = await prisma.application.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        resume: { select: { id: true, title: true } },
        vacancy: { select: { title: true, companyName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apps);
  }

  if (user.role === "SEEKER") {
    const apps = await prisma.application.findMany({
      where: { userId: user.id },
      include: { vacancy: { select: { title: true, companyName: true, city: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apps);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SEEKER") {
    return NextResponse.json({ error: "Только соискатели могут откликаться" }, { status: 403 });
  }

  const { vacancyId, resumeId, message } = await req.json();
  if (!vacancyId || !resumeId) {
    return NextResponse.json({ error: "Укажите вакансию и резюме" }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.userId !== user.id) {
    return NextResponse.json({ error: "Резюме не найдено" }, { status: 404 });
  }

  const existing = await prisma.application.findUnique({
    where: { userId_vacancyId: { userId: user.id, vacancyId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Вы уже откликнулись на эту вакансию" }, { status: 409 });
  }

  const application = await prisma.application.create({
    data: { userId: user.id, vacancyId, resumeId, message },
  });

  return NextResponse.json(application, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const type = searchParams.get("type") || "";
  const salaryFrom = searchParams.get("salaryFrom");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const where: Record<string, unknown> = { isPublished: true };
  if (search) where.OR = [{ title: { contains: search } }, { companyName: { contains: search } }, { description: { contains: search } }];
  if (city) where.city = { contains: city };
  if (type) where.type = type;
  if (salaryFrom) where.salaryFrom = { gte: parseInt(salaryFrom) };

  const [vacancies, total] = await Promise.all([
    prisma.vacancy.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vacancy.count({ where }),
  ]);

  return NextResponse.json({ vacancies, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Только работодатели могут создавать вакансии" }, { status: 403 });
  }

  const { companyName, title, description, requirements, salaryFrom, salaryTo, city, type } = await req.json();
  if (!companyName || !title || !description) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  const vacancy = await prisma.vacancy.create({
    data: {
      userId: user.id,
      companyName,
      title,
      description,
      requirements,
      salaryFrom: salaryFrom ? parseInt(salaryFrom) : null,
      salaryTo: salaryTo ? parseInt(salaryTo) : null,
      city,
      type: type || "FULL_TIME",
    },
  });

  return NextResponse.json(vacancy, { status: 201 });
}

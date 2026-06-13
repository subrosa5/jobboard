import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const salary = searchParams.get("salary");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const where: Record<string, unknown> = { isPublished: true };
  if (search) where.OR = [{ title: { contains: search } }, { summary: { contains: search } }];
  if (city) where.city = { contains: city };
  if (salary) where.salary = { gte: parseInt(salary) };

  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.resume.count({ where }),
  ]);

  return NextResponse.json({ resumes, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SEEKER") {
    return NextResponse.json({ error: "Только соискатели могут создавать резюме" }, { status: 403 });
  }

  const { title, summary, skills, experience, education, salary, city } = await req.json();
  if (!title) {
    return NextResponse.json({ error: "Укажите должность" }, { status: 400 });
  }

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title,
      summary,
      skills: JSON.stringify(skills || []),
      experience: JSON.stringify(experience || []),
      education,
      salary: salary ? parseInt(salary) : null,
      city,
    },
  });

  return NextResponse.json(resume, { status: 201 });
}

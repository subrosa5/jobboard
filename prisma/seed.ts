import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const seekerHash = await bcrypt.hash("seeker123", 12);
  const employerHash = await bcrypt.hash("employer123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jobboard.ru" },
    update: {},
    create: { name: "Администратор", email: "admin@jobboard.ru", password: adminHash, role: "ADMIN" },
  });

  const seeker = await prisma.user.upsert({
    where: { email: "ivan@example.ru" },
    update: {},
    create: { name: "Иван Петров", email: "ivan@example.ru", password: seekerHash, role: "SEEKER", phone: "+7 999 123-45-67" },
  });

  const employer = await prisma.user.upsert({
    where: { email: "hr@techcorp.ru" },
    update: {},
    create: { name: "Анна Смирнова (HR TechCorp)", email: "hr@techcorp.ru", password: employerHash, role: "EMPLOYER" },
  });

  // Resumes
  await prisma.resume.upsert({
    where: { id: "resume-1" },
    update: {},
    create: {
      id: "resume-1",
      userId: seeker.id,
      title: "Frontend-разработчик (React)",
      summary: "Опытный разработчик с 4 годами коммерческого опыта. Специализируюсь на React, TypeScript и современных инструментах разработки.",
      skills: JSON.stringify(["React", "TypeScript", "Next.js", "Tailwind CSS", "Git"]),
      experience: JSON.stringify([
        { company: "Digital Agency", position: "Frontend Developer", period: "2022 – 2024", description: "Разработка SPA приложений на React" },
        { company: "IT Startup", position: "Junior Frontend", period: "2020 – 2022", description: "Вёрстка и разработка компонентов" },
      ]),
      education: "МГТУ им. Баумана, Информатика, 2020",
      salary: 180000,
      city: "Москва",
    },
  });

  // Vacancies
  await prisma.vacancy.upsert({
    where: { id: "vacancy-1" },
    update: {},
    create: {
      id: "vacancy-1",
      userId: employer.id,
      companyName: "TechCorp",
      title: "Senior Frontend Developer",
      description: "Ищем опытного Frontend-разработчика в нашу команду.\n\nЧем вы будете заниматься:\n- Разработка пользовательских интерфейсов\n- Оптимизация производительности\n- Code review коллег\n- Участие в архитектурных решениях",
      requirements: "- Опыт работы с React от 3 лет\n- Знание TypeScript\n- Опыт работы с REST API\n- Умение работать в команде",
      salaryFrom: 180000,
      salaryTo: 250000,
      city: "Москва",
      type: "FULL_TIME",
    },
  });

  await prisma.vacancy.upsert({
    where: { id: "vacancy-2" },
    update: {},
    create: {
      id: "vacancy-2",
      userId: employer.id,
      companyName: "TechCorp",
      title: "Backend-разработчик (Node.js)",
      description: "Ищем Backend-разработчика для работы над нашим основным продуктом.",
      requirements: "- Node.js от 2 лет\n- PostgreSQL или MongoDB\n- REST API, GraphQL\n- Docker",
      salaryFrom: 150000,
      salaryTo: 200000,
      city: "Санкт-Петербург",
      type: "REMOTE",
    },
  });

  await prisma.vacancy.upsert({
    where: { id: "vacancy-3" },
    update: {},
    create: {
      id: "vacancy-3",
      userId: employer.id,
      companyName: "StartupXYZ",
      title: "Python-разработчик",
      description: "Разработка и поддержка backend-сервисов на Python/FastAPI.",
      requirements: "- Python 3.x\n- FastAPI или Django\n- SQL, PostgreSQL",
      salaryFrom: 120000,
      salaryTo: 180000,
      city: "Москва",
      type: "FULL_TIME",
    },
  });

  console.log("✅ Seed completed!");
  console.log("\nТестовые аккаунты:");
  console.log("  Администратор: admin@jobboard.ru / admin123");
  console.log("  Соискатель:    ivan@example.ru / seeker123");
  console.log("  Работодатель:  hr@techcorp.ru / employer123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

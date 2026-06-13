import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [vacancyCount, resumeCount, userCount] = await Promise.all([
    prisma.vacancy.count({ where: { isPublished: true } }),
    prisma.resume.count({ where: { isPublished: true } }),
    prisma.user.count(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-14 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Найдите работу мечты или идеального кандидата
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8">
            Тысячи вакансий и резюме на одной платформе
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vacancies"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Найти работу
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-400 border border-blue-400 transition-colors"
            >
              Разместить вакансию
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 md:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 md:gap-8 text-center">
          <div>
            <p className="text-2xl md:text-4xl font-bold text-blue-600">{vacancyCount}</p>
            <p className="text-sm md:text-base text-gray-600 mt-1">Вакансий</p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-bold text-blue-600">{resumeCount}</p>
            <p className="text-sm md:text-base text-gray-600 mt-1">Резюме</p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-bold text-blue-600">{userCount}</p>
            <p className="text-sm md:text-base text-gray-600 mt-1">Пользователей</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Как это работает</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Для соискателей</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Создайте резюме за 5 минут</li>
                <li>✓ Ищите вакансии с фильтрами</li>
                <li>✓ Откликайтесь в один клик</li>
                <li>✓ Отслеживайте статус откликов</li>
              </ul>
              <Link
                href="/auth/register"
                className="mt-6 block text-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Зарегистрироваться
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Для работодателей</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Размещайте вакансии бесплатно</li>
                <li>✓ Просматривайте резюме кандидатов</li>
                <li>✓ Получайте отклики</li>
                <li>✓ Управляйте всеми откликами</li>
              </ul>
              <Link
                href="/auth/register"
                className="mt-6 block text-center bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Разместить вакансию
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

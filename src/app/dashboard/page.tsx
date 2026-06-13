"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TelegramSettings from "@/components/TelegramSettings";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  telegramLinked: boolean;
  twoFAEnabled: boolean;
}

interface Resume {
  id: string;
  title: string;
  city: string | null;
  salary: number | null;
  isPublished: boolean;
  createdAt: string;
}

interface Vacancy {
  id: string;
  title: string;
  companyName: string;
  city: string | null;
  isPublished: boolean;
  createdAt: string;
  _count?: { applications: number };
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  vacancy?: { title: string; companyName: string; city: string | null };
  resume?: { title: string };
  user?: { name: string; email: string };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  REVIEWED: "Просмотрено",
  ACCEPTED: "Принято",
  REJECTED: "Отказ",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  REVIEWED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/profile").then((r) => r.json()).then(async (d) => {
      if (!d.user) {
        router.push("/auth/login");
        return;
      }
      setUser(d.user);

      if (d.user.role === "SEEKER") {
        const [rRes, aRes] = await Promise.all([
          fetch("/api/resumes/my"),
          fetch("/api/applications"),
        ]);
        const rData = await rRes.json();
        const aData = await aRes.json();
        setResumes(rData.resumes || []);
        setApplications(Array.isArray(aData) ? aData : []);
      } else if (d.user.role === "EMPLOYER") {
        const [vRes, aRes] = await Promise.all([
          fetch("/api/vacancies/my"),
          fetch("/api/applications"),
        ]);
        const vData = await vRes.json();
        const aData = await aRes.json();
        setVacancies(vData.vacancies || []);
        setApplications(Array.isArray(aData) ? aData : []);
      }
      setLoading(false);
    });
  }, [router]);

  async function updateApplicationStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Загрузка...</div>;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-gray-500 mt-1 text-sm">{user.name} · {user.role === "SEEKER" ? "Соискатель" : "Работодатель"}</p>
        </div>
        {user.role === "SEEKER" && (
          <Link href="/resumes/new" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shrink-0">
            + Создать резюме
          </Link>
        )}
        {user.role === "EMPLOYER" && (
          <Link href="/vacancies/new" className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shrink-0">
            + Разместить вакансию
          </Link>
        )}
      </div>

      {/* SEEKER section */}
      {user.role === "SEEKER" && (
        <div className="space-y-6">
          {/* Resumes */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Мои резюме ({resumes.length})</h2>
            {resumes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                <p>У вас ещё нет резюме</p>
                <Link href="/resumes/new" className="text-blue-600 hover:underline text-sm mt-2 block">
                  Создать первое резюме
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {resumes.map((r) => (
                  <Link key={r.id} href={`/resumes/${r.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{r.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.isPublished ? "Опубликовано" : "Скрыто"}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2 text-sm text-gray-500">
                        {r.city && <span>📍 {r.city}</span>}
                        {r.salary && <span>💰 {r.salary.toLocaleString()} ₽</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("ru-RU")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Applications */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Мои отклики ({applications.length})</h2>
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                <p>Вы ещё не откликались на вакансии</p>
                <Link href="/vacancies" className="text-blue-600 hover:underline text-sm mt-2 block">
                  Найти вакансии
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{a.vacancy?.title}</p>
                        <p className="text-sm text-gray-600">{a.vacancy?.companyName}</p>
                        {a.vacancy?.city && <p className="text-xs text-gray-400">📍 {a.vacancy.city}</p>}
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* EMPLOYER section */}
      {user.role === "EMPLOYER" && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Мои вакансии ({vacancies.length})</h2>
            {vacancies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                <p>У вас ещё нет вакансий</p>
                <Link href="/vacancies/new" className="text-blue-600 hover:underline text-sm mt-2 block">
                  Разместить первую вакансию
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {vacancies.map((v) => (
                  <Link key={v.id} href={`/vacancies/${v.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{v.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {v.isPublished ? "Активна" : "Скрыта"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{v.companyName}</p>
                      {v.city && <p className="text-xs text-gray-400">📍 {v.city}</p>}
                      {v._count !== undefined && (
                        <p className="text-xs text-blue-600 mt-1">{v._count.applications} откликов</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Incoming applications */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Входящие отклики ({applications.length})</h2>
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                Пока нет откликов на ваши вакансии
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{a.user?.name}</p>
                        <p className="text-sm text-gray-500">{a.user?.email}</p>
                        <p className="text-sm text-gray-600 mt-1">Резюме: <span className="font-medium">{a.resume?.title}</span></p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString("ru-RU")}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-3 py-1 rounded-full text-center font-medium ${STATUS_COLORS[a.status]}`}>
                          {STATUS_LABELS[a.status]}
                        </span>
                        {a.status === "PENDING" && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => updateApplicationStatus(a.id, "ACCEPTED")}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700"
                            >
                              Принять
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(a.id, "REJECTED")}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                            >
                              Отказ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Telegram 2FA — для всех ролей */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Безопасность</h2>
        <div className="max-w-md">
          <TelegramSettings
            telegramLinked={user.telegramLinked}
            twoFAEnabled={user.twoFAEnabled}
            onUpdate={(data) => setUser((prev) => prev ? { ...prev, ...data } : prev)}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Vacancy {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requirements: string | null;
  city: string | null;
  type: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  createdAt: string;
  user: { name: string; email: string };
  _count: { applications: number };
}

interface Resume {
  id: string;
  title: string;
}

interface CurrentUser {
  id: string;
  role: string;
}

const JOB_TYPES: Record<string, string> = {
  FULL_TIME: "Полная занятость",
  PART_TIME: "Частичная занятость",
  REMOTE: "Удалённо",
  CONTRACT: "Контракт",
};

export default function VacancyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    fetch(`/api/vacancies/${id}`).then((r) => r.json()).then(setVacancy);
    fetch("/api/auth/me").then((r) => r.json()).then(async (d) => {
      setUser(d.user);
      if (d.user?.role === "SEEKER") {
        const [resumeRes, appRes] = await Promise.all([
          fetch("/api/resumes/my"),
          fetch("/api/applications"),
        ]);
        const resumeData = await resumeRes.json();
        const appData = await appRes.json();
        setResumes(resumeData.resumes || []);
        if (Array.isArray(appData)) {
          setApplied(appData.some((a: { vacancyId: string }) => a.vacancyId === id));
        }
      }
    });
  }, [id]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResume) {
      setError("Выберите резюме");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacancyId: id, resumeId: selectedResume, message }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }
    setApplied(true);
    setShowApplyForm(false);
  }

  async function handleDelete() {
    if (!confirm("Удалить вакансию?")) return;
    await fetch(`/api/vacancies/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  function formatSalary(from: number | null, to: number | null) {
    if (!from && !to) return null;
    if (from && to) return `${from.toLocaleString()} – ${to.toLocaleString()} ₽`;
    if (from) return `от ${from.toLocaleString()} ₽`;
    return `до ${to!.toLocaleString()} ₽`;
  }

  if (!vacancy) {
    return <div className="text-center py-16 text-gray-400">Загрузка...</div>;
  }

  const salary = formatSalary(vacancy.salaryFrom, vacancy.salaryTo);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/vacancies" className="text-blue-600 hover:underline text-sm mb-4 block">
        ← Назад к вакансиям
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vacancy.title}</h1>
                <p className="text-lg text-gray-700 mt-1">{vacancy.companyName}</p>
              </div>
              {user?.role === "EMPLOYER" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {vacancy.city && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  📍 {vacancy.city}
                </span>
              )}
              <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {JOB_TYPES[vacancy.type]}
              </span>
              {salary && (
                <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full font-semibold">
                  💰 {salary}
                </span>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Опубликовано: {new Date(vacancy.createdAt).toLocaleDateString("ru-RU")} ·{" "}
              {vacancy._count.applications} откликов
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Описание</h2>
            <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{vacancy.description}</div>
          </div>

          {vacancy.requirements && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Требования</h2>
              <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{vacancy.requirements}</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Работодатель</h3>
            <p className="text-gray-700">{vacancy.companyName}</p>
            <p className="text-sm text-gray-500 mt-1">{vacancy.user.email}</p>
          </div>

          {!user && (
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-center">
              <p className="text-sm text-gray-700 mb-3">Войдите, чтобы откликнуться</p>
              <Link href="/auth/login" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                Войти
              </Link>
            </div>
          )}

          {user?.role === "SEEKER" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              {applied ? (
                <div className="text-center">
                  <p className="text-green-600 font-semibold">✓ Вы откликнулись</p>
                  <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mt-1 block">
                    Мои отклики
                  </Link>
                </div>
              ) : !showApplyForm ? (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Откликнуться
                </button>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Отклик на вакансию</h3>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Резюме</label>
                    {resumes.length === 0 ? (
                      <div>
                        <p className="text-sm text-gray-500">Нет резюме</p>
                        <Link href="/resumes/new" className="text-sm text-blue-600 hover:underline">
                          Создать резюме
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedResume}
                        onChange={(e) => setSelectedResume(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Выбрать...</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Сопроводительное письмо</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Расскажите, почему вы подходите для этой вакансии..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Отправляем..." : "Отправить"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Resume {
  id: string;
  title: string;
  summary: string | null;
  skills: string;
  experience: string;
  education: string | null;
  city: string | null;
  salary: number | null;
  createdAt: string;
  userId: string;
  user: { name: string; email: string; phone: string | null };
}

interface Experience {
  company: string;
  position: string;
  period: string;
  description: string;
}

export default function ResumePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/resumes/${id}`).then((r) => r.json()).then(setResume);
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setUserId(d.user.id);
        setUserRole(d.user.role);
      }
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Удалить резюме?")) return;
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (!resume) return <div className="text-center py-16 text-gray-400">Загрузка...</div>;

  let skills: string[] = [];
  let experience: Experience[] = [];
  try { skills = JSON.parse(resume.skills) || []; } catch {}
  try { experience = JSON.parse(resume.experience) || []; } catch {}

  const isOwner = userId === resume.userId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/resumes" className="text-blue-600 hover:underline text-sm mb-4 block">
        ← Назад к резюме
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
                  {resume.user.name[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{resume.title}</h1>
                  <p className="text-lg text-gray-700">{resume.user.name}</p>
                  {resume.city && <p className="text-sm text-gray-500 mt-1">📍 {resume.city}</p>}
                  {resume.salary && (
                    <p className="text-green-700 font-semibold mt-1">
                      💰 {resume.salary.toLocaleString()} ₽
                    </p>
                  )}
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                >
                  Удалить
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Обновлено: {new Date(resume.createdAt).toLocaleDateString("ru-RU")}
            </p>
          </div>

          {/* Summary */}
          {resume.summary && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">О себе</h2>
              <p className="text-gray-700 text-sm leading-relaxed">{resume.summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Навыки</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Опыт работы</h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-4">
                    <p className="font-semibold text-gray-900">{exp.position}</p>
                    <p className="text-gray-700">{exp.company}</p>
                    {exp.period && <p className="text-sm text-gray-500">{exp.period}</p>}
                    {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Образование</h2>
              <p className="text-gray-700 text-sm">{resume.education}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Контакты</h3>
            <p className="text-sm text-gray-700">{resume.user.name}</p>
            {userRole === "EMPLOYER" ? (
              <>
                <a href={`mailto:${resume.user.email}`} className="text-sm text-blue-600 hover:underline block mt-1">
                  {resume.user.email}
                </a>
                {resume.user.phone && (
                  <p className="text-sm text-gray-700 mt-1">{resume.user.phone}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Войдите как работодатель для просмотра контактов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ExperienceEntry {
  company: string;
  position: string;
  period: string;
  description: string;
}

export default function NewResumePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    education: "",
    salary: "",
    city: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "SEEKER") {
        router.push("/auth/login");
      }
    });
  }, [router]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }

  function addExperience() {
    setExperience((prev) => [...prev, { company: "", position: "", period: "", description: "" }]);
  }

  function updateExperience(i: number, field: string, value: string) {
    setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  }

  function removeExperience(i: number) {
    setExperience((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, skills, experience }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }
    router.push(`/resumes/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm mb-4 block">← Назад</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать резюме</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Основная информация</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Желаемая должность *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              placeholder="Frontend-разработчик"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Желаемая зарплата, ₽</label>
              <input
                type="number"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
                placeholder="100000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Москва"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
            <textarea
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={4}
              placeholder="Расскажите о себе, опыте и целях..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Навыки</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="JavaScript, React, Python..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Добавить
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-red-500 ml-1">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Опыт работы</h2>
            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-blue-600 hover:underline"
            >
              + Добавить
            </button>
          </div>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <p className="font-medium text-sm text-gray-700">Место {i + 1}</p>
                  <button type="button" onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-700 text-sm">
                    Удалить
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(i, "company", e.target.value)}
                    placeholder="Компания"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(i, "position", e.target.value)}
                    placeholder="Должность"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => updateExperience(i, "period", e.target.value)}
                  placeholder="Период (2021 – 2023)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(i, "description", e.target.value)}
                  rows={2}
                  placeholder="Описание обязанностей..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ))}
            {experience.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Нажмите &quot;Добавить&quot; чтобы добавить опыт работы</p>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Образование</h2>
          <textarea
            value={form.education}
            onChange={(e) => update("education", e.target.value)}
            rows={3}
            placeholder="МГУ, Факультет ВМК, 2018..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Сохраняем..." : "Опубликовать резюме"}
        </button>
      </form>
    </div>
  );
}

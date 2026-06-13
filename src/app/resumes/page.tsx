"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Resume {
  id: string;
  title: string;
  summary: string | null;
  skills: string;
  city: string | null;
  salary: number | null;
  createdAt: string;
  user: { name: string; email: string };
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [salary, setSalary] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (salary) params.set("salary", salary);
    params.set("page", String(p));
    const res = await fetch(`/api/resumes?${params}`);
    const data = await res.json();
    setResumes(data.resumes);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [search, city, salary]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [search, city, salary, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function resetFilters() {
    setSearch("");
    setSearchInput("");
    setCity("");
    setSalary("");
  }

  function getSkills(skillsJson: string): string[] {
    try {
      return JSON.parse(skillsJson) || [];
    } catch {
      return [];
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">База резюме</h1>
        <span className="text-gray-500 text-sm">{total} найдено</span>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        <aside className="w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Фильтры</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Город</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ожидаемая зарплата от, ₽</label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="50000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={resetFilters}
                className="w-full text-sm text-gray-600 hover:text-red-600 transition-colors py-1"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Должность, навыки, ключевые слова..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Найти
            </button>
          </form>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Загрузка...</div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Резюме не найдены</p>
              <button onClick={resetFilters} className="text-blue-600 hover:underline text-sm mt-2">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((r) => {
                const skills = getSkills(r.skills);
                return (
                  <Link key={r.id} href={`/resumes/${r.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                              {r.user.name[0].toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{r.title}</h3>
                              <p className="text-sm text-gray-500">{r.user.name}</p>
                            </div>
                          </div>
                          {r.summary && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.summary}</p>
                          )}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {skills.slice(0, 5).map((s, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {s}
                                </span>
                              ))}
                              {skills.length > 5 && (
                                <span className="text-xs text-gray-400">+{skills.length - 5}</span>
                              )}
                            </div>
                          )}
                          {r.city && (
                            <span className="text-xs text-gray-500 mt-2 block">📍 {r.city}</span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {r.salary && (
                            <p className="font-semibold text-green-700">{r.salary.toLocaleString()} ₽</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); load(p); }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

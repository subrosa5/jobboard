"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Vacancy {
  id: string;
  title: string;
  companyName: string;
  city: string | null;
  type: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  createdAt: string;
  user: { name: string };
}

const JOB_TYPES: Record<string, string> = {
  FULL_TIME: "Полная занятость",
  PART_TIME: "Частичная занятость",
  REMOTE: "Удалённо",
  CONTRACT: "Контракт",
};

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (salaryFrom) params.set("salaryFrom", salaryFrom);
    params.set("page", String(p));
    const res = await fetch(`/api/vacancies?${params}`);
    const data = await res.json();
    setVacancies(data.vacancies);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [search, city, type, salaryFrom]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [search, city, type, salaryFrom, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function resetFilters() {
    setSearch("");
    setSearchInput("");
    setCity("");
    setType("");
    setSalaryFrom("");
    setShowFilters(false);
  }

  function formatSalary(from: number | null, to: number | null) {
    if (!from && !to) return "Зарплата не указана";
    if (from && to) return `${from.toLocaleString()} – ${to.toLocaleString()} ₽`;
    if (from) return `от ${from.toLocaleString()} ₽`;
    return `до ${to!.toLocaleString()} ₽`;
  }

  const activeFilterCount = [city, type, salaryFrom, search].filter(Boolean).length;

  const FilterPanel = () => (
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
          <label className="block text-sm text-gray-600 mb-1">Тип занятости</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все типы</option>
            {Object.entries(JOB_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Зарплата от, ₽</label>
          <input
            type="number"
            value={salaryFrom}
            onChange={(e) => setSalaryFrom(e.target.value)}
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
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Вакансии</h1>
        <span className="text-gray-500 text-sm">{total} найдено</span>
      </div>

      {/* Search — always visible */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Должность, компания..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 md:px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          Найти
        </button>
      </form>

      {/* Mobile filter toggle */}
      <button
        className="md:hidden mb-4 flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
        onClick={() => setShowFilters(!showFilters)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Фильтры
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
        )}
        <span className="ml-auto">{showFilters ? "▲" : "▼"}</span>
      </button>

      {/* Mobile filter panel */}
      {showFilters && (
        <div className="md:hidden mb-4">
          <FilterPanel />
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <FilterPanel />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Загрузка...</div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Вакансии не найдены</p>
              <button onClick={resetFilters} className="text-blue-600 hover:underline text-sm mt-2">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {vacancies.map((v) => (
                <Link key={v.id} href={`/vacancies/${v.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg hover:text-blue-600 leading-snug">{v.title}</h3>
                        <p className="text-gray-600 mt-0.5 text-sm">{v.companyName}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {v.city && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              📍 {v.city}
                            </span>
                          )}
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {JOB_TYPES[v.type] || v.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-green-700 text-sm">{formatSalary(v.salaryFrom, v.salaryTo)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(v.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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

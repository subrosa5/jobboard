"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { resumes: number; vacancies: number; applications: number };
}

const ROLE_LABELS: Record<string, string> = {
  SEEKER: "Соискатель",
  EMPLOYER: "Работодатель",
  ADMIN: "Администратор",
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(async (d) => {
      if (!d.user || d.user.role !== "ADMIN") {
        router.push("/");
        return;
      }
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    });
  }, [router]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-16 text-gray-400">Загрузка...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель администратора</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          <p className="text-gray-500 mt-1">Пользователей</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.role === "SEEKER").length}
          </p>
          <p className="text-gray-500 mt-1">Соискателей</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {users.filter((u) => u.role === "EMPLOYER").length}
          </p>
          <p className="text-gray-500 mt-1">Работодателей</p>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Все пользователи</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Резюме</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Вакансии</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Отклики</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === "ADMIN" ? "bg-purple-50 text-purple-700" :
                      u.role === "EMPLOYER" ? "bg-green-50 text-green-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u._count.resumes}</td>
                  <td className="px-4 py-3 text-gray-600">{u._count.vacancies}</td>
                  <td className="px-4 py-3 text-gray-600">{u._count.applications}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">Пользователи не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
}

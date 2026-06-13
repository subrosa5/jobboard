"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const roleLabel = user?.role === "EMPLOYER" ? "Работодатель" : user?.role === "ADMIN" ? "Администратор" : "Соискатель";

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">JobBoard</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/vacancies" className="hover:text-blue-600 transition-colors">Вакансии</Link>
            <Link href="/resumes" className="hover:text-blue-600 transition-colors">Резюме</Link>
            {user && (
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Личный кабинет</Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-blue-600 transition-colors text-purple-600">Админ</Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg px-3 py-1.5"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link href="/vacancies" className="block text-sm text-gray-700 hover:text-blue-600">Вакансии</Link>
            <Link href="/resumes" className="block text-sm text-gray-700 hover:text-blue-600">Резюме</Link>
            {user && <Link href="/dashboard" className="block text-sm text-gray-700 hover:text-blue-600">Личный кабинет</Link>}
            {user?.role === "ADMIN" && <Link href="/admin" className="block text-sm text-purple-600">Админ</Link>}
            {user ? (
              <button onClick={logout} className="block text-sm text-red-600">Выйти</button>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" className="text-sm text-gray-700">Войти</Link>
                <Link href="/auth/register" className="text-sm text-blue-600">Регистрация</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

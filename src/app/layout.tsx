import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "JobBoard — Работа в России",
  description: "Платформа для поиска работы и сотрудников",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          © 2024 JobBoard. Все права защищены.
        </footer>
      </body>
    </html>
  );
}

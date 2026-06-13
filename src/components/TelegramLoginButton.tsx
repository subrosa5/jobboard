"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

interface Props {
  onSuccess?: () => void;
}

export default function TelegramLoginButton({ onSuccess }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  const handleAuth = useCallback(
    async (telegramUser: TelegramUser) => {
      const res = await fetch("/api/auth/telegram-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramUser),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    },
    [router, onSuccess]
  );

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = handleAuth;

    // Чистим предыдущий виджет
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [botUsername, handleAuth]);

  if (!botUsername || botUsername === "ВСТАВЬТЕ_USERNAME_БОТА") {
    return (
      <div className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 text-center">
        <p className="text-xs text-gray-400">
          Telegram-вход не настроен.{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Создайте бота
          </a>{" "}
          и укажите токен в <code className="bg-gray-100 px-1 rounded">.env</code>
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}

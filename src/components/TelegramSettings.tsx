"use client";

import { useState } from "react";

interface Props {
  telegramLinked: boolean;
  twoFAEnabled: boolean;
  onUpdate: (data: { telegramLinked: boolean; twoFAEnabled: boolean }) => void;
}

export default function TelegramSettings({ telegramLinked, twoFAEnabled, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUnlink() {
    if (!confirm("Отвязать Telegram? 2FA будет отключена.")) return;
    setLoading(true);
    await fetch("/api/auth/telegram-link", { method: "DELETE" });
    setLoading(false);
    onUpdate({ telegramLinked: false, twoFAEnabled: false });
  }

  async function handleToggle2FA(enabled: boolean) {
    setLoading(true);
    const res = await fetch("/api/auth/toggle-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) onUpdate({ telegramLinked, twoFAEnabled: data.twoFAEnabled });
    else setError(data.error);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">💬</div>
        <div>
          <h3 className="font-semibold text-gray-900">Telegram 2FA</h3>
          <p className="text-sm text-gray-500">Двухфакторная аутентификация через Telegram</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      {!telegramLinked ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Telegram не привязан. Войдите через Telegram на странице{" "}
            <a href="/auth/login" className="text-blue-600 hover:underline">входа</a> — аккаунт привяжется автоматически.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <span>✓</span>
            <span className="text-sm font-medium">Telegram привязан</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Двухфакторная аутентификация</p>
              <p className="text-xs text-gray-500">Код в Telegram при каждом входе через пароль</p>
            </div>
            <button
              onClick={() => handleToggle2FA(!twoFAEnabled)}
              disabled={loading}
              className={`relative w-12 h-6 rounded-full transition-colors ${twoFAEnabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFAEnabled ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>

          <button
            onClick={handleUnlink}
            disabled={loading}
            className="w-full text-sm text-red-600 border border-red-200 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Отвязать Telegram
          </button>
        </div>
      )}
    </div>
  );
}

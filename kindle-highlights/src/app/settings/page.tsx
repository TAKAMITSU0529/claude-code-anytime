"use client";

import { useEffect, useState } from "react";

interface NotificationSetting {
  id: string;
  webhookUrl: string;
  scheduleTimes: string;
  isEnabled: boolean;
  highlightCount: number;
}

export default function SettingsPage() {
  const [setting, setSetting] = useState<NotificationSetting | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [times, setTimes] = useState<string[]>(["07:00"]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [highlightCount, setHighlightCount] = useState(3);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSetting(data);
        setWebhookUrl(data.webhookUrl || "");
        setTimes(JSON.parse(data.scheduleTimes || '["07:00"]'));
        setIsEnabled(data.isEnabled);
        setHighlightCount(data.highlightCount);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        scheduleTimes: times,
        isEnabled,
        highlightCount,
      }),
    });
    if (res.ok) {
      setMessage("設定を保存しました");
    } else {
      setMessage("保存に失敗しました");
    }
    setSaving(false);
  }

  async function handleTestNotification() {
    setTesting(true);
    setMessage("");
    const res = await fetch("/api/notification/test", { method: "POST" });
    const data = await res.json();
    setMessage(data.message || data.error);
    setTesting(false);
  }

  function addTime() {
    setTimes([...times, "12:00"]);
  }

  function removeTime(index: number) {
    setTimes(times.filter((_, i) => i !== index));
  }

  function updateTime(index: number, value: string) {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  }

  if (!setting) {
    return <div className="text-center py-20 text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">通知設定</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">通知を有効にする</h3>
            <p className="text-sm text-gray-500">
              指定時刻にDiscordへハイライトを通知します
            </p>
          </div>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isEnabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Discord Webhook URL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Discord Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Discordのサーバー設定 → 連携サービス → ウェブフック から作成できます
          </p>
        </div>

        {/* Schedule times */}
        <div>
          <label className="block text-sm font-medium mb-2">通知時刻</label>
          <div className="space-y-2">
            {times.map((time, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                {times.length > 1 && (
                  <button
                    onClick={() => removeTime(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addTime}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + 時刻を追加
          </button>
        </div>

        {/* Highlight count */}
        <div>
          <label className="block text-sm font-medium mb-1">
            1回の通知で送るハイライト数
          </label>
          <select
            value={highlightCount}
            onChange={(e) => setHighlightCount(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {[1, 2, 3, 5].map((n) => (
              <option key={n} value={n}>
                {n} 件
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? "保存中..." : "設定を保存"}
          </button>
          <button
            onClick={handleTestNotification}
            disabled={testing || !webhookUrl}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-medium"
          >
            {testing ? "送信中..." : "テスト通知を送信"}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes("失敗") || message.includes("エラー")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

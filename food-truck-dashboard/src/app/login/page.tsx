"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("パスワードが違います");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-sm p-8 text-center">
        <div className="text-4xl">🍙</div>
        <h1 className="mt-2 text-lg font-bold">お結び屋 日本の心</h1>
        <p className="mt-1 text-sm text-ink-3">売上報告ダッシュボード</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="共通パスワード"
          autoFocus
          className="mt-6 w-full rounded-xl border border-line px-4 py-3 text-center text-lg focus:border-accent focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-xl bg-accent py-3 font-bold text-white disabled:opacity-40"
        >
          {busy ? "確認中…" : "ログイン"}
        </button>
      </form>
    </div>
  );
}

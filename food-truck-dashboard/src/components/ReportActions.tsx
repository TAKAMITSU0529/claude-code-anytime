"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ReportActions({
  reportId,
  status,
  synced,
}: {
  reportId: string;
  status: string;
  synced: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const finalize = async () => {
    if (
      !confirm(
        "この報告を確定して、Googleスプレッドシートの売上台帳へ反映しますか？"
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "確定に失敗しました");
      setMessage(data.message || "確定しました");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "確定に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("この報告を削除しますか？（元に戻せません）")) return;
    await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      {status !== "final" || !synced ? (
        <button
          onClick={finalize}
          disabled={busy}
          className="w-full rounded-2xl bg-accent py-4 text-lg font-bold text-white shadow disabled:opacity-40"
        >
          {busy ? "反映中…" : "✅ 確定して売上台帳へ反映"}
        </button>
      ) : null}
      {message && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm">{message}</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <div className="flex gap-2">
        <Link
          href={`/reports/${reportId}/edit`}
          className="flex-1 rounded-xl border border-line bg-surface py-3 text-center text-sm font-bold text-ink-2"
        >
          ✏️ 編集
        </Link>
        <button
          onClick={remove}
          className="flex-1 rounded-xl border border-line bg-surface py-3 text-sm text-red-600"
        >
          🗑 削除
        </button>
      </div>
    </div>
  );
}

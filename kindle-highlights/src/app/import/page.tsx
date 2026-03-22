"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type ImportMode = "sync" | "easy" | "file";

export default function ImportPage() {
  const [mode, setMode] = useState<ImportMode>("sync");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [hasCookie, setHasCookie] = useState<boolean | null>(null);
  const [result, setResult] = useState<{
    message: string;
    importedBooks: number;
    importedHighlights: number;
    totalBooks?: number;
    skippedHighlights?: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check if Amazon cookie is set
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setHasCookie(!!data.amazonCookie);
      })
      .catch(() => setHasCookie(false));
  }, []);

  async function handleSync() {
    setUploading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "同期に失敗しました");
      } else {
        setResult(data);
      }
    } catch {
      setError("通信エラーが発生しました");
    }
    setUploading(false);
  }

  async function handleFileUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "インポートに失敗しました");
      } else {
        setResult(data);
      }
    } catch {
      setError("通信エラーが発生しました");
    }
    setUploading(false);
  }

  async function handlePasteImport() {
    if (!pasteText.trim() || !bookTitle.trim()) return;
    setUploading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/import/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText,
          bookTitle: bookTitle.trim(),
          bookAuthor: bookAuthor.trim() || "不明",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "インポートに失敗しました");
      } else {
        setResult(data);
      }
    } catch {
      setError("通信エラーが発生しました");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  function resetState() {
    setResult(null);
    setPasteText("");
    setBookTitle("");
    setBookAuthor("");
    setStep(1);
    setError("");
    setFile(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-6">
        {([
          { key: "sync" as const, label: "Kindle同期" },
          { key: "easy" as const, label: "コピペ" },
          { key: "file" as const, label: "ファイル" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setMode(key); resetState(); }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base transition-colors ${
              mode === key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== Sync Mode ===== */}
      {mode === "sync" && !result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">Kindleハイライトを自動同期</h2>
          <p className="text-sm text-gray-600 mb-6">
            ボタンを押すだけで、Kindleでハイライトした全ての本とマーカーを
            自動的に取り込みます。
          </p>

          {hasCookie === null && (
            <div className="text-center py-8 text-gray-400">確認中...</div>
          )}

          {hasCookie === true && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600 text-lg">✓</span>
                  <span className="font-medium text-green-800">
                    Amazon連携済み
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  同期の準備ができています。
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={uploading}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 shadow-md transition-colors"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Amazonから取得中...
                  </span>
                ) : (
                  "Kindleと同期する"
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                既に取り込み済みのハイライトはスキップされます
              </p>
            </div>
          )}

          {hasCookie === false && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-yellow-800 mb-1">
                  初回セットアップが必要です
                </p>
                <p className="text-sm text-yellow-700">
                  設定ページでAmazon Cookieを登録してください。
                  一度登録すれば、以降はボタン1つで同期できます。
                </p>
              </div>
              <a
                href="/settings"
                className="block w-full py-3 bg-blue-600 text-white rounded-lg text-center font-bold hover:bg-blue-700 active:bg-blue-800"
              >
                設定ページへ
              </a>
            </div>
          )}
        </div>
      )}

      {/* ===== Easy (paste) mode ===== */}
      {mode === "easy" && !result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s === step
                      ? "bg-blue-600 text-white"
                      : s < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded ${s < step ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-3">
                Amazonのハイライトページを開く
              </h2>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  Amazonに自分のKindleハイライトが全部保存されています。
                  下のボタンからアクセスしてください。
                </p>
                <a
                  href="https://read.amazon.co.jp/notebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-orange-500 text-white rounded-lg text-center font-bold text-base hover:bg-orange-600 active:bg-orange-700"
                >
                  Amazonのハイライトを開く
                </a>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ※ Amazonへのログインが必要です
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-800">開いたら：</p>
                <p>1. 取り込みたい本をタップ</p>
                <p>2. ハイライト一覧が表示される</p>
                <p>3. ハイライトのテキストを<strong>長押しして全選択→コピー</strong></p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 active:bg-blue-800"
              >
                コピーしたら次へ →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-3">
                本の情報を入れて、ハイライトを貼り付け
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    本のタイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="例：嫌われる勇気"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    著者名
                  </label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="例：岸見一郎"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ハイライトを貼り付け <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"コピーしたハイライトをここに貼り付けてください。\n\n1つ1行でもOK、まとめて貼ってもOKです。"}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {pasteText ? `${pasteText.trim().split("\n").filter(l => l.trim()).length} 行のテキスト` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← 戻る
                </button>
                <button
                  onClick={() => {
                    if (!bookTitle.trim()) {
                      setError("本のタイトルを入力してください");
                      return;
                    }
                    if (!pasteText.trim()) {
                      setError("ハイライトを貼り付けてください");
                      return;
                    }
                    setError("");
                    setStep(3);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800"
                >
                  確認へ →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-3">確認してインポート</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500">本のタイトル</span>
                  <p className="font-medium">{bookTitle}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">著者</span>
                  <p className="font-medium">{bookAuthor || "不明"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">ハイライト数（目安）</span>
                  <p className="font-medium">
                    {pasteText.trim().split("\n").filter(l => l.trim()).length} 件
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">プレビュー</span>
                  <div className="mt-1 max-h-32 overflow-y-auto text-sm text-gray-600 bg-white rounded p-2 border">
                    {pasteText.trim().split("\n").filter(l => l.trim()).slice(0, 5).map((line, i) => (
                      <p key={i} className="py-1 border-b last:border-0 border-gray-100">
                        {line.length > 80 ? line.slice(0, 80) + "..." : line}
                      </p>
                    ))}
                    {pasteText.trim().split("\n").filter(l => l.trim()).length > 5 && (
                      <p className="text-gray-400 text-xs pt-1">...他にもあります</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← 修正する
                </button>
                <button
                  onClick={handlePasteImport}
                  disabled={uploading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
                >
                  {uploading ? "取り込み中..." : "インポート開始"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== File mode ===== */}
      {mode === "file" && !result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-8 shadow-sm">
          <div className="mb-4 text-sm text-gray-600 space-y-2">
            <p>
              Kindle端末をPCに接続し、
              <code className="bg-gray-100 px-1 rounded text-xs">
                documents/My Clippings.txt
              </code>{" "}
              ファイルをアップロードしてください。
            </p>
            <p>ハイライト（マーカー）部分のみが取り込まれます。</p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 active:bg-blue-50 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {file ? (
              <div>
                <p className="text-base sm:text-lg font-medium text-blue-600">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">📁</p>
                <p className="text-gray-700 text-base font-medium mb-1">
                  タップしてファイルを選択
                </p>
                <p className="text-gray-400 text-xs hidden sm:block">
                  またはドラッグ＆ドロップ
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || uploading}
            className="mt-4 sm:mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
          >
            {uploading ? "インポート中..." : "インポート開始"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          {error.includes("Cookie") && (
            <a
              href="/settings"
              className="block mt-2 text-blue-600 underline font-medium"
            >
              設定ページでCookieを更新する →
            </a>
          )}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-green-800 font-bold text-lg mb-2">
            {mode === "sync" ? "同期完了！" : "インポート完了！"}
          </h3>
          <ul className="text-green-700 space-y-1 text-sm">
            {result.totalBooks !== undefined && (
              <li>検出された書籍: {result.totalBooks} 冊</li>
            )}
            <li>新規書籍: {result.importedBooks} 冊</li>
            <li>新規ハイライト: {result.importedHighlights} 件</li>
            {result.skippedHighlights !== undefined && result.skippedHighlights > 0 && (
              <li className="text-green-600">
                既存（スキップ）: {result.skippedHighlights} 件
              </li>
            )}
          </ul>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-medium"
            >
              本棚を見る
            </button>
            <button
              onClick={resetState}
              className="flex-1 px-4 py-3 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-medium"
            >
              続けて追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

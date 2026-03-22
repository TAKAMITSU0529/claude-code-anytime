"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    importedBooks: number;
    importedHighlights: number;
  } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload() {
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        My Clippings.txt をインポート
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-8 shadow-sm mb-6">
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

        {/* Drop zone / File picker */}
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
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-4 sm:mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
        >
          {uploading ? "インポート中..." : "インポート開始"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-green-800 font-bold text-lg mb-2">
            インポート完了
          </h3>
          <ul className="text-green-700 space-y-1 text-sm">
            <li>新規書籍: {result.importedBooks} 冊</li>
            <li>新規ハイライト: {result.importedHighlights} 件</li>
          </ul>
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-medium"
          >
            本棚を見る
          </button>
        </div>
      )}
    </div>
  );
}

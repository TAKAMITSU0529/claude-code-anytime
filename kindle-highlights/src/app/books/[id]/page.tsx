"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";

interface Highlight {
  id: string;
  content: string;
  summary: string | null;
  location: string | null;
  highlightedAt: string | null;
  memo: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  genre: string | null;
  highlights: Highlight[];
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [editingGenre, setEditingGenre] = useState(false);
  const [genre, setGenre] = useState("");
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");
  const [summarizing, setSummarizing] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then(setBook);
  }, [id]);

  async function saveGenre() {
    await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre }),
    });
    setBook((b) => (b ? { ...b, genre } : b));
    setEditingGenre(false);
  }

  async function saveMemo(highlightId: string) {
    await fetch(`/api/highlights/${highlightId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo: memoText }),
    });
    setBook((b) =>
      b
        ? {
            ...b,
            highlights: b.highlights.map((h) =>
              h.id === highlightId ? { ...h, memo: memoText } : h
            ),
          }
        : b
    );
    setEditingMemoId(null);
  }

  async function regenerateSummary(highlightId: string) {
    setSummarizing(highlightId);
    const res = await fetch(`/api/highlights/${highlightId}/summarize`, {
      method: "POST",
    });
    if (res.ok) {
      const updated = await res.json();
      setBook((b) =>
        b
          ? {
              ...b,
              highlights: b.highlights.map((h) =>
                h.id === highlightId ? { ...h, summary: updated.summary } : h
              ),
            }
          : b
      );
    }
    setSummarizing(null);
  }

  if (!book) {
    return <div className="text-center py-20 text-gray-500">読み込み中...</div>;
  }

  return (
    <div>
      <Link
        href="/"
        className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block"
      >
        ← 本棚に戻る
      </Link>

      {/* Book header */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="w-24 sm:w-32 flex-shrink-0">
          <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden shadow-md relative">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-blue-200">
                <span className="text-4xl">📖</span>
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold mb-1 break-words">{book.title}</h1>
          <p className="text-gray-600 mb-2 text-sm sm:text-base">{book.author}</p>

          {/* Genre */}
          <div className="flex items-center gap-2 mb-2">
            {editingGenre ? (
              <>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="ジャンルを入力"
                  className="px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={saveGenre}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingGenre(false)}
                  className="text-sm text-gray-500"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                {book.genre ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {book.genre}
                  </span>
                ) : null}
                <button
                  onClick={() => {
                    setGenre(book.genre || "");
                    setEditingGenre(true);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {book.genre ? "変更" : "ジャンルを設定"}
                </button>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500">
            {book.highlights.length} ハイライト
          </p>
        </div>
      </div>

      {/* Highlights list */}
      <h2 className="text-lg font-bold mb-4">ハイライト一覧</h2>
      <div className="space-y-4">
        {book.highlights.map((h) => (
          <div
            key={h.id}
            className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 shadow-sm"
          >
            <blockquote className="text-gray-800 text-sm sm:text-base border-l-4 border-blue-400 pl-3 sm:pl-4 mb-3 leading-relaxed">
              {h.content}
            </blockquote>

            {/* Summary */}
            {h.summary && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <span className="text-xs text-blue-600 font-medium">AI要約</span>
                <p className="text-sm text-blue-900 mt-1">{h.summary}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => regenerateSummary(h.id)}
                disabled={summarizing === h.id}
                className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                {summarizing === h.id ? "生成中..." : h.summary ? "要約を再生成" : "要約を生成"}
              </button>
            </div>

            {/* Memo */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {editingMemoId === h.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="メモを入力..."
                    className="flex-1 px-3 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={() => saveMemo(h.id)}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingMemoId(null)}
                    className="text-sm text-gray-500"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {h.memo ? (
                    <span className="text-sm text-gray-600">💬 {h.memo}</span>
                  ) : null}
                  <button
                    onClick={() => {
                      setMemoText(h.memo || "");
                      setEditingMemoId(h.id);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {h.memo ? "編集" : "メモを追加"}
                  </button>
                </div>
              )}
            </div>

            {/* Location & date */}
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              {h.location && <span>位置: {h.location}</span>}
              {h.highlightedAt && (
                <span>
                  {new Date(h.highlightedAt).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

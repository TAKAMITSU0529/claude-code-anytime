"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  genre: string | null;
  _count: { highlights: number };
}

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [selectedGenre, sort]);

  async function fetchBooks() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedGenre) params.set("genre", selectedGenre);
    if (search) params.set("search", search);
    params.set("sort", sort);

    const res = await fetch(`/api/books?${params}`);
    const data = await res.json();
    setBooks(data);

    // Extract unique genres
    const allGenres = data
      .map((b: Book) => b.genre)
      .filter((g: string | null): g is string => !!g);
    setGenres([...new Set(allGenres)] as string[]);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchBooks();
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="タイトル・著者名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            検索
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="createdAt">追加日順</option>
          <option value="title">タイトル順</option>
          <option value="highlights">ハイライト数順</option>
        </select>
      </div>

      {/* Genre tabs */}
      {genres.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGenre("")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              !selectedGenre
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            すべて
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedGenre === g
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Book grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">読み込み中...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">まだ本がありません</p>
          <Link
            href="/import"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            My Clippings.txt をインポート
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group block"
            >
              <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow relative">
                {book.coverImageUrl ? (
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-blue-200">
                    <span className="text-3xl mb-2">📖</span>
                    <span className="text-xs text-center text-gray-600 font-medium line-clamp-3">
                      {book.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-600">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {book._count.highlights} ハイライト
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

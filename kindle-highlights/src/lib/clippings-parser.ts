export interface ParsedHighlight {
  title: string;
  author: string;
  content: string;
  location: string | null;
  highlightedAt: Date | null;
}

export function parseClippings(text: string): ParsedHighlight[] {
  const entries = text.split("==========").map((e) => e.trim()).filter(Boolean);
  const highlights: ParsedHighlight[] = [];

  for (const entry of entries) {
    const lines = entry.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    // Line 1: "Book Title (Author Name)" or "Book Title - Author Name"
    const titleLine = lines[0];
    const { title, author } = parseTitleAuthor(titleLine);

    // Line 2: metadata (location, date) - starts with "-"
    const metaLine = lines[1];
    if (!metaLine.startsWith("-")) continue;

    // Only process highlights (not bookmarks or notes)
    if (!metaLine.includes("ハイライト") && !metaLine.toLowerCase().includes("highlight")) {
      continue;
    }

    const location = parseLocation(metaLine);
    const highlightedAt = parseDate(metaLine);

    // Line 3+: the highlighted content
    const content = lines.slice(2).join("\n").trim();
    if (!content) continue;

    highlights.push({ title, author, content, location, highlightedAt });
  }

  return highlights;
}

function parseTitleAuthor(line: string): { title: string; author: string } {
  // Pattern: "Title (Author)"
  const parenMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return { title: parenMatch[1].trim(), author: parenMatch[2].trim() };
  }

  // Pattern: "Title - Author"
  const dashMatch = line.match(/^(.+?)\s*-\s*([^-]+)$/);
  if (dashMatch) {
    return { title: dashMatch[1].trim(), author: dashMatch[2].trim() };
  }

  return { title: line.trim(), author: "Unknown" };
}

function parseLocation(metaLine: string): string | null {
  // Japanese: "位置No. 123-456" or English: "Location 123-456"
  const locMatch = metaLine.match(/(?:位置No\.\s*|Location\s*)(\d+[-–]\d+|\d+)/i);
  return locMatch ? locMatch[1] : null;
}

function parseDate(metaLine: string): Date | null {
  // Japanese date: "2024年1月15日月曜日 10:30:00"
  const jpMatch = metaLine.match(/(\d{4})年(\d{1,2})月(\d{1,2})日.+?(\d{1,2}):(\d{2}):(\d{2})/);
  if (jpMatch) {
    const [, y, m, d, h, min, s] = jpMatch;
    return new Date(+y, +m - 1, +d, +h, +min, +s);
  }

  // English date patterns
  const enMatch = metaLine.match(
    /(\w+),\s+(\w+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i
  );
  if (enMatch) {
    const dateStr = `${enMatch[2]} ${enMatch[3]}, ${enMatch[4]} ${enMatch[5]}:${enMatch[6]}:${enMatch[7]} ${enMatch[8] || ""}`;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

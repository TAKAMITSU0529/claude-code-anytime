import * as cheerio from "cheerio";

export interface KindleBook {
  title: string;
  author: string;
  asin: string;
  highlights: KindleHighlight[];
}

export interface KindleHighlight {
  content: string;
  location: string | null;
  color: string | null;
}

/**
 * Fetch all Kindle highlights from Amazon's notebook page.
 * Requires the user's Amazon cookie string.
 */
export async function fetchKindleHighlights(
  cookie: string,
  region: "jp" | "com" = "jp"
): Promise<KindleBook[]> {
  const domain = region === "jp" ? "read.amazon.co.jp" : "read.amazon.com";
  const url = `https://${domain}/notebook`;

  const res = await fetch(url, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ja,en;q=0.9",
    },
    redirect: "manual",
  });

  // If redirected, cookie is likely invalid/expired
  if (res.status >= 300 && res.status < 400) {
    throw new Error("COOKIE_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`Amazon responded with status ${res.status}`);
  }

  const html = await res.text();

  // Check if we got a login page instead of notebook
  if (
    html.includes("ap_email") ||
    html.includes("signIn") ||
    html.includes("auth-mfa")
  ) {
    throw new Error("COOKIE_EXPIRED");
  }

  return parseNotebookHtml(html);
}

/**
 * Parse the Amazon Kindle Notebook HTML to extract books and highlights.
 */
function parseNotebookHtml(html: string): KindleBook[] {
  const $ = cheerio.load(html);
  const books: KindleBook[] = [];

  // Amazon Kindle Notebook page structure:
  // Each book section has class "kp-notebook-library-each"
  // Within each book: title in h2, author in p, ASIN in data attribute
  // Highlights are in spans with id "highlight" or class "kp-notebook-highlight"

  // Strategy 1: Parse by book annotation containers
  $(".a-row.kp-notebook-library-each").each((_, bookEl) => {
    const book = parseBookFromAnnotationContainer($, bookEl);
    if (book && book.highlights.length > 0) {
      books.push(book);
    }
  });

  if (books.length > 0) return books;

  // Strategy 2: Parse by annotation divs (alternative page structure)
  $("[id^='kp-notebook-annotations-']").each((_, el) => {
    const asin = $(el).attr("id")?.replace("kp-notebook-annotations-", "") || "";
    const book = parseBookFromAnnotationDiv($, el, asin);
    if (book && book.highlights.length > 0) {
      books.push(book);
    }
  });

  if (books.length > 0) return books;

  // Strategy 3: Try broader selectors
  const allHighlights = parseHighlightsFromGenericStructure($);
  if (allHighlights.length > 0) {
    books.push({
      title: "Kindleハイライト",
      author: "不明",
      asin: "unknown",
      highlights: allHighlights,
    });
  }

  return books;
}

function parseBookFromAnnotationContainer(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookEl: any
): KindleBook | null {
  const $book = $(bookEl);

  const title =
    $book.find("h2").first().text().trim() ||
    $book.find(".kp-notebook-searchable").first().text().trim();
  const author =
    $book.find("p.kp-notebook-searchable").text().trim() ||
    $book.find(".kp-notebook-searchable").eq(1).text().trim();
  const asin = $book.attr("data-asin") || $book.find("[data-asin]").attr("data-asin") || "";

  if (!title) return null;

  const highlights: KindleHighlight[] = [];

  // Find highlight elements within this book container
  $book.find("#highlight, .kp-notebook-highlight, .kp-notebook-highlight span").each(
    (_, hlEl) => {
      const content = $(hlEl).text().trim();
      if (content && content.length > 0) {
        const location = extractLocationFromNearby($, hlEl);
        const color = extractColorFromNearby($, hlEl);
        highlights.push({ content, location, color });
      }
    }
  );

  return { title, author: author || "不明", asin, highlights };
}

function parseBookFromAnnotationDiv(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: any,
  asin: string
): KindleBook | null {
  const $el = $(el);

  const title = $el.find("h3, h2, .kp-notebook-searchable").first().text().trim();
  const author = $el.find("p.kp-notebook-searchable, .kp-notebook-metadata span").text().trim();

  const highlights: KindleHighlight[] = [];

  $el.find("#highlight, .kp-notebook-highlight, [id^='highlight-']").each((_, hlEl) => {
    const content = $(hlEl).text().trim();
    if (content) {
      highlights.push({
        content,
        location: extractLocationFromNearby($, hlEl),
        color: extractColorFromNearby($, hlEl),
      });
    }
  });

  if (!title && highlights.length === 0) return null;

  return {
    title: title || "不明なタイトル",
    author: author || "不明",
    asin,
    highlights,
  };
}

function parseHighlightsFromGenericStructure(
  $: cheerio.CheerioAPI
): KindleHighlight[] {
  const highlights: KindleHighlight[] = [];

  // Try various selectors that Amazon might use
  const selectors = [
    "#highlight",
    ".kp-notebook-highlight",
    "[id^='highlight']",
    ".a-text-quote",
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const content = $(el).text().trim();
      if (content && content.length > 2) {
        highlights.push({ content, location: null, color: null });
      }
    });
    if (highlights.length > 0) break;
  }

  return highlights;
}

function extractLocationFromNearby(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: any
): string | null {
  const parent = $(el).closest(".kp-notebook-row-separator, .a-row, div");
  const text = parent.text();
  const locMatch = text.match(
    /(?:位置|Location|ページ|Page)[\s:：]*No?\.?\s*(\d+[-–]?\d*)/i
  );
  return locMatch ? locMatch[1] : null;
}

function extractColorFromNearby(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: any
): string | null {
  const parent = $(el).closest(".kp-notebook-row-separator, .a-row, div");
  const colorMatch = parent
    .text()
    .match(/(イエロー|ブルー|ピンク|オレンジ|Yellow|Blue|Pink|Orange)/i);
  return colorMatch ? colorMatch[1] : null;
}

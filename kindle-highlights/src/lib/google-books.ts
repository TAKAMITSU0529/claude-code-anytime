export async function fetchCoverImage(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    const thumbnail = item?.volumeInfo?.imageLinks?.thumbnail;

    return thumbnail ? thumbnail.replace("http://", "https://") : null;
  } catch {
    return null;
  }
}

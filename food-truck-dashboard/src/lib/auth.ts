// Edgeランタイム（middleware）でも動くよう Web Crypto のみ使用
const COOKIE_NAME = "ftd_auth";

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function authToken(): Promise<string> {
  return hmacHex(
    process.env.AUTH_SECRET || "dev-secret",
    `ftd:${process.env.APP_PASSWORD || ""}`
  );
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await authToken());
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD || "";
  return expected.length > 0 && password === expected;
}

export { COOKIE_NAME };

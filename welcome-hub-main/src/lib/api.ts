import { API_BASE_URL } from "./config";
import { getStoredUser } from "./session";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const desktopPath = path.startsWith("/api/") ? `/desktop${path}` : path;
  const url = path.startsWith("http")
    ? path
    : API_BASE_URL
      ? `${API_BASE_URL}${desktopPath}`
      : desktopPath;

  const storedUser = getStoredUser();
  const desktopHeaders = storedUser?.id ? { "x-desktop-user": storedUser.id } : {};

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...desktopHeaders,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg = typeof json?.error === "string" ? json.error : res.statusText;
    throw new Error(msg || "Request failed");
  }
  return json as T;
}

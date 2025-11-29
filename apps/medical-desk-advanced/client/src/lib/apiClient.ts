import { getToken } from "./auth";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    let message = "Erro na requisição.";
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

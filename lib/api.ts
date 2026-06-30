// Cliente HTTP del backend de Faro (repo `faro`).
// La sesión viaja en cookie httpOnly => credentials: 'include'.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

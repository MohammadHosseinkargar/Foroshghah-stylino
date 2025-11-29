export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

async function parseError(res: Response) {
  try {
    const data = await res.json();
    if (data?.detail) return Array.isArray(data.detail) ? data.detail[0].msg || data.detail : data.detail;
    return "خطای ناشناخته سرور";
  } catch (_e) {
    return "خطا در ارتباط با سرور";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(typeof message === "string" ? message : "خطا در ارتباط با سرور");
  }
  try {
    return (await res.json()) as T;
  } catch (_e) {
    // no body
    return {} as T;
  }
}

export async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, init);
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiEnvelope<T> = { success: true; message: string; data: T } | { message?: string; errors?: { message: string }[] };

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const payload: ApiEnvelope<T> | null = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      (payload && "errors" in payload && payload.errors?.[0]?.message) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return payload && "data" in payload ? payload.data : (payload as T);
}

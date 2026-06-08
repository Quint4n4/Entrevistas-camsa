/**
 * Cliente HTTP central: el ÚNICO lugar que toca fetch.
 * Maneja la URL base, JSON, el token del admin (si existe) y los errores.
 * El formulario público no usa token; el panel admin sí.
 */
import { adminToken } from "./tokenStore";

const BASE = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public body?: unknown,
  ) {
    super(detail);
  }
}

function extractDetail(body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    return String((body as { detail: unknown }).detail);
  }
  return "Ocurrió un error inesperado.";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = adminToken.get();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    adminToken.clear();
    const body = await res.json().catch(() => ({}));
    throw new ApiError(401, extractDetail(body) || "Sesión no válida.", body);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, extractDetail(body), body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b: unknown = {}) =>
    request<T>(p, { method: "POST", body: JSON.stringify(b) }),
  patch: <T>(p: string, b: unknown) =>
    request<T>(p, { method: "PATCH", body: JSON.stringify(b) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

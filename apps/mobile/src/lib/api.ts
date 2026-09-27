import type { AppType } from "@lovenotes/api/app-type";
import type { ApiErrorBody } from "@lovenotes/contracts";
import { hc } from "hono/client";
import { Platform } from "react-native";
import { sessionCookie } from "./auth";
import { API_URL } from "./config";
import { ApiError } from "./errors";

const authedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  const cookie = await sessionCookie();
  if (cookie) headers.set("cookie", cookie);
  return fetch(input, { ...init, headers, credentials: Platform.OS === "web" ? "include" : "omit" });
};

/** Typed API client — request/response types come straight from the server routes. */
export const api = hc<AppType>(`${API_URL}/v1`, { fetch: authedFetch as typeof fetch });

type ClientResponse = { ok: boolean; status: number; json(): Promise<unknown> };

/** Unwrap a Hono client response: JSON on success, ApiError otherwise. */
export async function unwrap<R extends ClientResponse>(
  p: Promise<R>,
): Promise<R extends { json(): Promise<infer T> } ? Exclude<T, ApiErrorBody> : never> {
  let res: R;
  try {
    res = await p;
  } catch {
    throw new ApiError("NETWORK", 0, "network");
  }
  if (res.status === 204) return undefined as never;
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const e = (body as ApiErrorBody | null)?.error;
    throw new ApiError(e?.code ?? "INTERNAL", res.status, e?.message ?? "error", e?.fields);
  }
  return body as never;
}

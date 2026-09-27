import type { ErrorCode } from "@lovenotes/contracts";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: ContentfulStatusCode,
    message?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message ?? code);
  }
}

export const notFound = (code: ErrorCode = "NOT_FOUND") => new AppError(code, 404);
export const conflict = (code: ErrorCode, message?: string) => new AppError(code, 409, message);
export const forbidden = (code: ErrorCode = "FORBIDDEN_ACTION", message?: string) => new AppError(code, 403, message);
export const unauthenticated = () => new AppError("UNAUTHENTICATED", 401);

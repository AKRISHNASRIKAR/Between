import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";
import type { z } from "zod";
import { AppError } from "./errors";

/** zod-backed Hono validator that throws our standard VALIDATION_FAILED envelope. */
export const validate = <Target extends keyof ValidationTargets, S extends z.ZodType>(target: Target, schema: S) =>
  validator(target, (value) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
      throw new AppError("VALIDATION_FAILED", 422, "Some fields need another look.", fields);
    }
    return result.data as z.output<S>;
  });

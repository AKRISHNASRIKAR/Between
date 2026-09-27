import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  PUBLIC_API_URL: z.url(),
  APP_SCHEME: z.string().min(1).default("lovenotes"),
  PORT: z.coerce.number().int().default(3000),
  EMAIL_TRANSPORT: z.enum(["console", "resend"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Love Notes <hello@example.com>"),
  PUSH_TRANSPORT: z.enum(["console", "expo"]).default("console"),
  /** local = files on disk (dev). s3 = any S3-compatible bucket, e.g. Cloudflare R2. */
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Enables /v1/dev/* (simulated partner). Refused in production. */
  DEV_TOOLS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** Dev only: every sign-in code is this value, so no email is needed. Refused in production. */
  DEV_FIXED_OTP: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.prettifyError(parsed.error));
  process.exit(1);
}
if (parsed.data.EMAIL_TRANSPORT === "resend" && !parsed.data.RESEND_API_KEY) {
  console.error("EMAIL_TRANSPORT=resend requires RESEND_API_KEY");
  process.exit(1);
}

if (
  parsed.data.STORAGE_DRIVER === "s3" &&
  !(parsed.data.S3_ENDPOINT && parsed.data.S3_BUCKET && parsed.data.S3_ACCESS_KEY_ID && parsed.data.S3_SECRET_ACCESS_KEY)
) {
  console.error("STORAGE_DRIVER=s3 requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY");
  process.exit(1);
}
if (parsed.data.NODE_ENV === "production" && (parsed.data.DEV_FIXED_OTP || parsed.data.DEV_TOOLS)) {
  console.error("DEV_FIXED_OTP / DEV_TOOLS must never be set in production");
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV !== "production";

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

export const env = parsed.data;
export const isDev = env.NODE_ENV !== "production";

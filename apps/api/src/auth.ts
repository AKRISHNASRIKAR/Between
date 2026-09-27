import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db/client";
import * as schema from "./db/schema";
import { env, isDev } from "./env";
import { sendEmail } from "./lib/email";

export const auth = betterAuth({
  baseURL: env.PUBLIC_API_URL,
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/v1/auth",
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  advanced: { database: { generateId: "uuid" } },
  user: {
    additionalFields: { timezone: { type: "string", required: false, defaultValue: "UTC", input: false } },
  },
  session: { expiresIn: 60 * 60 * 24 * 60, updateAge: 60 * 60 * 24 },
  trustedOrigins: [
    `${env.APP_SCHEME}://`,
    ...(isDev ? ["exp://", "exp://**", "http://localhost:8081", "http://localhost:3000"] : []),
  ],
  rateLimit: { enabled: env.NODE_ENV === "production", window: 60, max: 30 },
  plugins: [
    expo(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      ...(env.DEV_FIXED_OTP && { generateOTP: () => env.DEV_FIXED_OTP }),
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          to: email,
          subject: `${otp} is your Love Notes code`,
          text: `Your code is ${otp}. It expires in 10 minutes. If you didn't ask for this, you can ignore it.`,
        });
      },
    }),
  ],
});

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

import { env } from "../env";

type Mail = { to: string; subject: string; text: string };

/** Dev/test outbox — lets integration tests read OTP codes. Never populated in production. */
export const devOutbox: Mail[] = [];

export async function sendEmail(mail: Mail): Promise<void> {
  if (env.EMAIL_TRANSPORT === "console") {
    devOutbox.push(mail);
    if (env.NODE_ENV === "test") return;
    console.info(`\n✉️  [dev email] to=${mail.to}\n   ${mail.subject}\n   ${mail.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) throw new Error(`email send failed: ${res.status}`);
}

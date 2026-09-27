import { app } from "../src/app";
import { sql } from "../src/db/client";
import { devOutbox } from "../src/lib/email";

export async function resetDb() {
  await sql`truncate table users, spaces restart identity cascade`;
}

export type Client = {
  cookie: string;
  req: (method: string, path: string, body?: unknown) => Promise<{ status: number; json: any }>;
};

const jsonHeaders = { "content-type": "application/json", origin: "http://localhost:3000" };

export async function signIn(email: string, name = email.split("@")[0]): Promise<Client> {
  await app.request("/v1/auth/email-otp/send-verification-otp", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, type: "sign-in" }),
  });
  const mail = devOutbox.findLast((m) => m.to === email);
  const otp = mail?.subject.slice(0, 6);
  const res = await app.request("/v1/auth/sign-in/email-otp", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, otp }),
  });
  if (res.status !== 200) throw new Error(`sign-in failed ${res.status} ${await res.text()}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const client: Client = {
    cookie,
    async req(method, path, body) {
      const r = await app.request(`/v1${path}`, {
        method,
        headers: { ...jsonHeaders, cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await r.text();
      return { status: r.status, json: text ? JSON.parse(text) : null };
    },
  };
  await client.req("PATCH", "/me", { displayName: name, timezone: "Asia/Kolkata" });
  return client;
}

/** Two users paired into one space (egg hatched). */
export async function pairedCouple(prefix = "c") {
  const a = await signIn(`${prefix}-a@test.dev`, "Krishna");
  const b = await signIn(`${prefix}-b@test.dev`, "Ananya");
  const space = (await a.req("POST", "/spaces", { timezone: "Asia/Kolkata" })).json;
  const invite = (await a.req("POST", `/spaces/${space.id}/invites`)).json;
  await b.req("POST", `/invites/${invite.code}/accept`);
  return { a, b, spaceId: space.id as string };
}

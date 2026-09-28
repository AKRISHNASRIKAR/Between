import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { S3Client } from "bun";
import { env } from "../env";

/**
 * Object storage behind one small interface (SPEC §7.7).
 *  - "local" (default, dev): files on disk under apps/api/.data/media, served by the API via
 *    short-lived HMAC-signed URLs. No cloud account needed — works fully offline.
 *  - "s3" (production): any S3-compatible bucket, e.g. Cloudflare R2, via presigned PUT/GET.
 */
export interface Storage {
  signedPutUrl(key: string, contentType: string, maxBytes: number): string;
  signedGetUrl(key: string): string;
  exists(key: string): Promise<{ bytes: number } | null>;
  deletePrefix(prefix: string): Promise<void>;
}

const ROOT = new URL("../../.data/media/", import.meta.url).pathname;
const PUT_TTL_S = 5 * 60;
const GET_TTL_S = 60 * 60;

type Claim = { k: string; m: "put" | "get"; e: number; ct?: string; mx?: number };

const sign = (payload: string) => createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest("base64url");

export function makeToken(c: Claim): string {
  const body = Buffer.from(JSON.stringify(c)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string, mode: Claim["m"]): Claim | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  if (expected.length !== mac.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Claim;
    if (c.m !== mode || c.e < Date.now() / 1000) return null;
    return c;
  } catch {
    return null;
  }
}

/** Keys are always spaces/{spaceId}/media/{mediaId}/{file} — never user-controlled paths. */
export const safePath = (key: string) => {
  if (!/^spaces\/[0-9a-f-]{36}\/media\/[0-9a-f-]{36}\/(main|thumb)\.(jpg|png|webp|heic)$/.test(key))
    throw new Error("bad key");
  return join(ROOT, key);
};

export const localStorage: Storage = {
  signedPutUrl(key, contentType, maxBytes) {
    const t = makeToken({
      k: key,
      m: "put",
      e: Math.floor(Date.now() / 1000) + PUT_TTL_S,
      ct: contentType,
      mx: maxBytes,
    });
    return `${env.PUBLIC_API_URL}/v1/files/${t}`;
  },
  signedGetUrl(key) {
    // Round expiry to the hour so URLs are stable within a window (better client caching).
    const e = Math.ceil((Date.now() / 1000 + GET_TTL_S) / 3600) * 3600;
    return `${env.PUBLIC_API_URL}/v1/files/${makeToken({ k: key, m: "get", e })}`;
  },
  async exists(key) {
    try {
      const s = await stat(safePath(key));
      return { bytes: s.size };
    } catch {
      return null;
    }
  },
  async deletePrefix(prefix) {
    if (!/^spaces\/[0-9a-f-]{36}(\/media\/[0-9a-f-]{36})?\/?$/.test(prefix)) throw new Error("bad prefix");
    await rm(join(ROOT, prefix), { recursive: true, force: true });
  },
};

export async function writeLocal(key: string, data: ArrayBuffer) {
  const path = safePath(key);
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, data);
}

/** S3-compatible bucket (Cloudflare R2 in production). Clients upload/download directly. */
function s3Storage(): Storage {
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  });
  return {
    signedPutUrl(key, contentType) {
      safePath(key);
      return client.presign(key, { method: "PUT", expiresIn: PUT_TTL_S, type: contentType });
    },
    signedGetUrl(key) {
      return client.presign(key, { method: "GET", expiresIn: GET_TTL_S });
    },
    async exists(key) {
      try {
        const s = await client.stat(key);
        return { bytes: s.size };
      } catch {
        return null;
      }
    },
    async deletePrefix(prefix) {
      if (!/^spaces\/[0-9a-f-]{36}(\/media\/[0-9a-f-]{36})?\/?$/.test(prefix)) throw new Error("bad prefix");
      let token: string | undefined;
      do {
        const page = await client.list({ prefix, continuationToken: token });
        await Promise.all((page.contents ?? []).map((o) => client.delete(o.key)));
        token = page.isTruncated ? page.nextContinuationToken : undefined;
      } while (token);
    },
  };
}

export const storage: Storage = env.STORAGE_DRIVER === "s3" ? s3Storage() : localStorage;

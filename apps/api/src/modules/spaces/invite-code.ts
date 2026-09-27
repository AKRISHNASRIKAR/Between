import { createHash } from "node:crypto";
import { INVITE_ALPHABET, LIMITS } from "@lovenotes/contracts";

/** ~40 bits of entropy from an unambiguous 31-char alphabet (rejection sampling, no modulo bias). */
export function generateInviteCode(): string {
  const n = INVITE_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < LIMITS.inviteCodeLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    for (const b of bytes) {
      if (b < limit && out.length < LIMITS.inviteCodeLength) out += INVITE_ALPHABET[b % n];
    }
  }
  return out;
}

/** Only the hash is stored. Codes are normalized (uppercase, no dash) before hashing. */
export const hashInviteCode = (code: string) => createHash("sha256").update(code).digest();

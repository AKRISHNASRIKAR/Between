import { type DevPartnerAction, type DevPartnerStatus, MOOD_IDS } from "@lovenotes/contracts";
import { db } from "../../db/client";
import { env } from "../../env";
import { AppError, conflict, notFound } from "../../lib/errors";
import { newId } from "../../lib/ids";
import { makeSpaceScope, type SpaceScope } from "../../lib/scope";
import { readToken, writeLocal } from "../../lib/storage";
import { localDate } from "../../lib/time";
import { realtime } from "../../realtime/hub";
import type { AuthedUser } from "../../types";
import { addFuture, listFuture, setFutureDone } from "../future";
import { addBlock, completeUpload, createPage, createUpload, findPageByDate } from "../journal";
import { activeScope, membersRepo } from "../members";
import { createNote, listNotes, openNote, reactToNote } from "../notes";
import { careForPet, petNameStep } from "../pet";
import { answer, complete, getDaily, getSession, listPacks, listSessions, startPack } from "../quizzes";
import { acceptInvite, createInvite } from "../spaces";
import { upsertVibe } from "../vibes";
import { devRepo } from "./dev.repo";
import { placeholderPng } from "./png";

export function assertDevTools() {
  if (!env.DEV_TOOLS || env.NODE_ENV === "production") throw notFound();
}

async function myScope(user: AuthedUser): Promise<SpaceScope> {
  const scope = await activeScope(db, user);
  if (!scope) throw conflict("NOT_IN_SPACE", "Create a space first.");
  return scope;
}

async function partnerOf(scope: SpaceScope) {
  const members = await membersRepo.of(db, scope);
  return members.find((m) => m.id !== scope.userId && !m.leftAt) ?? null;
}

export async function devStatus(user: AuthedUser): Promise<DevPartnerStatus> {
  const scope = await activeScope(db, user);
  const p = scope ? await partnerOf(scope) : null;
  return {
    enabled: true,
    partner: p && scope ? { id: p.id, displayName: p.name, online: realtime.isOnline(scope.spaceId, p.id) } : null,
  };
}

/** Create a pretend partner and have them join the caller's space (hatching the egg). */
export async function devCreatePartner(user: AuthedUser, name = "Ananya"): Promise<DevPartnerStatus> {
  const scope = await myScope(user);
  if (await partnerOf(scope)) return devStatus(user);

  const email = `partner-${user.id.slice(0, 8)}-${Date.now().toString(36)}@dev.local`;
  const partner = await devRepo.createUser(db, { name, email, timezone: user.timezone });
  if (!partner) throw new AppError("INTERNAL", 500);
  const invite = await createInvite(scope);
  await acceptInvite(
    { id: partner.id, email, name, image: null, timezone: partner.timezone },
    invite.code.replace("-", ""),
  );
  return devStatus(user);
}

/** A scope for acting *as* the simulated partner in the caller's space. */
async function partnerScope(user: AuthedUser): Promise<SpaceScope> {
  const mine = await myScope(user);
  const p = await partnerOf(mine);
  if (!p) throw conflict("NOT_IN_SPACE", "No simulated partner yet.");
  return makeSpaceScope({
    spaceId: mine.spaceId,
    userId: p.id,
    partnerId: user.id,
    writable: mine.writable,
    timezone: p.timezone,
  });
}

/** Perform one action *as* the partner, through the real services (same events, bond, pushes). */
export async function devPartnerAct(user: AuthedUser, action: DevPartnerAction): Promise<DevPartnerStatus> {
  const scope = await partnerScope(user);
  switch (action.type) {
    case "online":
      if (realtime.join(scope.spaceId, scope.userId))
        realtime.publish(scope.spaceId, { t: "presence", userId: scope.userId, online: true });
      break;
    case "offline":
      // Drop every simulated connection.
      while (realtime.isOnline(scope.spaceId, scope.userId)) realtime.leave(scope.spaceId, scope.userId);
      realtime.publish(scope.spaceId, { t: "presence", userId: scope.userId, online: false });
      break;
    case "pet":
      await careForPet(scope, { id: newId(), kind: action.kind });
      break;
    case "pet.proposeName":
      await petNameStep(scope, { action: "propose", name: action.name });
      break;
    case "pet.acceptName":
      await petNameStep(scope, { action: "accept" });
      break;
    case "mood": {
      const mood = action.mood ?? MOOD_IDS[Math.floor(Math.random() * MOOD_IDS.length)] ?? "calm";
      await upsertVibe(scope, localDate(new Date(), scope.timezone), {
        id: newId(),
        mood,
        visibility: action.visibility,
      });
      break;
    }
    case "note.send": {
      const bodies = [
        "Good luck today — you've got this.",
        "I remembered you wanted to watch that film. Friday?",
        "You looked really cute this morning.",
        "Thinking about you. That's the whole note.",
      ];
      const body = action.body ?? bodies[Math.floor(Math.random() * bodies.length)] ?? "Hi you.";
      await createNote(scope, { id: newId(), body, paper: action.paper ?? "cream" });
      break;
    }
    case "note.openLatest":
    case "note.reactLatest": {
      const inbox = await listNotes(scope, "inbox", undefined, 1);
      const latest = inbox.items[0];
      if (!latest) throw conflict("NOT_FOUND", "No note to open yet.");
      if (action.type === "note.openLatest") await openNote(scope, latest.id);
      else await reactToNote(scope, latest.id, true);
      break;
    }
    case "quiz.answerAll": {
      const pick = <T>(xs: readonly T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];
      const sessions = (await listSessions(scope)).filter((x) => !x.myCompletedAt);
      const daily = await getDaily(scope);
      const ids = [...sessions.map((x) => x.id), ...(daily && !daily.myCompletedAt ? [daily.id] : [])];
      for (const id of ids) {
        const session = await getSession(scope, id);
        for (const q of session.questions) {
          const opt = pick(q.options ?? [])?.id;
          await answer(scope, id, q.id, {
            ...(q.kind === "choice" && { choice: opt, guess: pick(q.options ?? [])?.id }),
            ...(q.kind === "who" && { who: pick(["me", "partner"] as const) }),
            ...(q.kind === "open" && {
              text: pick(["Honestly? You.", "That rainy walk.", "Something with you in it.", "Pizza. Always pizza."]),
            }),
          });
        }
        await complete(scope, id);
      }
      break;
    }
    case "future.add": {
      const ideas = [
        "Watch the sunrise together",
        "Visit Japan",
        "Learn to make pasta",
        "Adopt a dog",
        "Road trip to Goa",
      ];
      const title = action.title ?? ideas[Math.floor(Math.random() * ideas.length)] ?? "Something new";
      await addFuture(scope, { id: newId(), title, category: "dream" });
      break;
    }
    case "future.completeFirst": {
      const open = (await listFuture(scope)).find((f) => !f.completedAt);
      if (!open) throw conflict("NOT_FOUND", "Nothing left to complete.");
      await setFutureDone(scope, open.id, true);
      break;
    }
    case "journal.write":
    case "journal.photo": {
      const today = localDate(new Date(), scope.timezone);
      const existing = await findPageByDate(scope, today);
      let mediaIds: string[] = [];
      if (action.type === "journal.photo") {
        const palettes: Array<[[number, number, number], [number, number, number]]> = [
          [
            [247, 215, 116],
            [244, 135, 110],
          ],
          [
            [156, 203, 242],
            [185, 162, 236],
          ],
          [
            [134, 201, 160],
            [247, 161, 73],
          ],
        ];
        const [c1, c2] = palettes[Math.floor(Math.random() * palettes.length)] ??
          palettes[0] ?? [
            [0, 0, 0],
            [0, 0, 0],
          ];
        const full = placeholderPng(800, 600, c1, c2);
        const thumb = placeholderPng(240, 180, c1, c2);
        const id = newId();
        const intent = await createUpload(scope, {
          id,
          mime: "image/png",
          bytes: full.byteLength,
          thumbBytes: thumb.byteLength,
          width: 800,
          height: 600,
          caption: "a little sunset",
        });
        const key = (u: string) => readToken(u.split("/").pop() ?? "", "put")?.k ?? "";
        await writeLocal(key(intent.uploadUrl), full.buffer);
        await writeLocal(key(intent.thumbUploadUrl), thumb.buffer);
        await completeUpload(scope, id);
        mediaIds = [id];
      }
      const body =
        action.type === "journal.write"
          ? (action.body ?? "Today was a good one. That café was terrible though 😂")
          : null;
      const block = { id: newId(), body, mediaIds };
      if (existing) await addBlock(scope, existing, block);
      else await createPage(scope, { id: newId(), pageDate: today, title: null, block });
      break;
    }
    case "quiz.start": {
      const packs = await listPacks(db);
      const pack = packs.find((p) => p.slug === action.packSlug);
      if (!pack) throw notFound();
      await startPack(scope, { id: newId(), packId: pack.id });
      break;
    }
  }
  return devStatus(user);
}

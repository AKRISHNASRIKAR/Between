import type { DevPartnerAction } from "@lovenotes/contracts";
import { keys } from "@/features/space/keys";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { DEV_FIXED_OTP } from "@/lib/dev";
import { newId } from "@/lib/ids";
import { queryClient } from "@/lib/query";
import { signOut } from "@/lib/session";
import { deviceTimezone } from "@/lib/time";
import { allowsMockConnections, type MockScenario } from "./mock-policy";

export async function createMockCouple(scenario: MockScenario, progress: (message: string) => void) {
  if (!allowsMockConnections(__DEV__, API_URL))
    throw new Error("Mock couples require a development build connected to a localhost API.");
  progress("Preparing an isolated local account…");
  const existing = await authClient.getSession();
  if (existing.data) await signOut();
  const email = `between-ui-${scenario}-${newId()}@dev.local`;
  const sent = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
  if (sent.error) throw new Error("Could not start local sign-in. Check that the development API is running.");
  const signed = await authClient.signIn.emailOtp({ email, otp: DEV_FIXED_OTP });
  if (signed.error)
    throw new Error("Local sign-in needs DEV_FIXED_OTP=000000 in apps/api/.env. This does not bypass authentication.");
  // The authenticated API gate must explicitly confirm dev tools before any simulated action.
  await unwrap(api.dev.partner.$get()).catch(() => {
    throw new Error("The local API must have DEV_TOOLS=true. No mock partner was created.");
  });
  const me = await unwrap(api.me.$patch({ json: { displayName: "Sam", timezone: deviceTimezone() } }));
  queryClient.setQueryData(keys.me, me);
  progress("Connecting Sam and Alex…");
  const space = await unwrap(api.spaces.$post({ json: { name: "Sam & Alex · UI test", timezone: deviceTimezone() } }));
  await unwrap(api.dev.partner.$post({ json: { name: "Alex" } }));
  const act = (action: DevPartnerAction) => unwrap(api.dev.partner.act.$post({ json: action }));
  if (scenario !== "empty") {
    progress("Adding sample notes, feelings and plans…");
    const notes =
      scenario === "returning"
        ? [
            "Welcome back. I saved a little thought for you.",
            "Remember our rainy walk home?",
            "The best part of today was telling you about it.",
            "Let's find another little café this weekend.",
          ]
        : ["Thinking of you. Hope your day has a soft landing.", "Saved you the last cookie."];
    for (const body of notes) await act({ type: "note.send", body, paper: "cream" });
    await act({ type: "mood", mood: "calm", visibility: "shared" });
    await act({ type: "future.add", title: "Try the café around the corner" });
    await act({ type: "future.add", title: "Take the long way home" });
    await act({
      type: "journal.write",
      body: "An ordinary day worth keeping. Coffee, a long conversation, and nowhere else to be.",
    });
    // Generated local sample artwork, never the device's real photo library.
    await act({ type: "journal.photo" });
    const packs = await unwrap(api["quiz-packs"].$get());
    const first = packs[0];
    if (first) await act({ type: "quiz.start", packSlug: first.slug });
    if (scenario === "returning") {
      progress("Adding dated history without changing clocks…");
      for (const days of [7, 21, 45]) {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - days);
        await unwrap(
          api.spaces[":sid"].journal.pages.$post({
            param: { sid: space.id },
            json: {
              id: newId(),
              pageDate: date.toISOString().slice(0, 10),
              title: days === 45 ? "The first little adventure" : "A day to remember",
              block: {
                id: newId(),
                body: `A sample memory from ${days} days ago. A little part of our story.`,
                mediaIds: [],
              },
            },
          }),
        );
      }
    }
    await act({ type: "online" });
  }
  progress("Opening your mock space…");
  const ready = await unwrap(api.me.$get());
  queryClient.setQueryData(keys.me, ready);
  await queryClient.invalidateQueries();
  return ready;
}

import { expect, test } from "bun:test";
import type { PetRow } from "./pet.repo";
import { toPetView } from "./pet.view";

const pause = new Date("2026-10-01T12:00:00.000Z");
const resume = new Date("2026-11-01T12:00:00.000Z");
const hour = 3_600_000;
const row = (offsetMs = 0): PetRow => ({
  id: "00000000-0000-4000-8000-000000000001",
  spaceId: "00000000-0000-4000-8000-000000000002",
  status: "PAUSED",
  decisionId: null,
  decisionBy: null,
  proposedEnabled: null,
  pausedAt: pause,
  lastStateUpdateAt: pause,
  species: "dog",
  name: "Mochi",
  proposedName: null,
  proposedBy: null,
  stage: "baby",
  bond: 20,
  hatchedAt: new Date(pause.getTime() - 10 * 24 * hour),
  lastFedAt: new Date(pause.getTime() - 2 * hour + offsetMs),
  lastPlayedAt: new Date(pause.getTime() - hour),
  lastPettedAt: new Date(pause.getTime() - 4 * hour),
  lastSharedActivityAt: null,
  lastUpdatePushAt: null,
  appearance: {},
  version: 1,
  createdAt: pause,
});

test("resume at the decision instant preserves frozen age and wellbeing on both sides of a rounding boundary", () => {
  for (const offset of [-1, 0, 1]) {
    const paused = row(offset);
    const frozen = toPetView(paused, { timezone: "UTC" }, [], resume);
    const elapsed = resume.getTime() - pause.getTime();
    const resumed = {
      ...paused,
      status: "ACTIVE",
      pausedAt: null,
      hatchedAt: new Date((paused.hatchedAt?.getTime() ?? 0) + elapsed),
      lastFedAt: new Date((paused.lastFedAt?.getTime() ?? 0) + elapsed),
      lastPlayedAt: new Date((paused.lastPlayedAt?.getTime() ?? 0) + elapsed),
      lastPettedAt: new Date((paused.lastPettedAt?.getTime() ?? 0) + elapsed),
    };
    const atDecision = toPetView(resumed, { timezone: "UTC" }, [], resume);
    expect(atDecision.ageDays).toBe(frozen.ageDays);
    expect(atDecision.wellbeing).toEqual(frozen.wellbeing);
  }
});

test("a later active read can legitimately cross the rounding boundary without rewriting the resume response", () => {
  const base = row();
  const resumed = { ...base, status: "ACTIVE", pausedAt: null, lastFedAt: new Date(resume.getTime() - 2 * hour) };
  expect(toPetView(resumed, { timezone: "UTC" }, [], resume).wellbeing.fullness.value).toBe(0.94);
  expect(toPetView(resumed, { timezone: "UTC" }, [], new Date(resume.getTime() + 1)).wellbeing.fullness.value).toBe(
    0.93,
  );
});

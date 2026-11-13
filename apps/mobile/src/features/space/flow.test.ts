import { describe, expect, test } from "bun:test";
import type { Me } from "@lovenotes/contracts";
import { flowState, restorablePath } from "./flow";

const member = (id: string) => ({ id, displayName: id, avatarUrl: null, role: "member" as const, joinedAt: "" });
const me = (
  over: {
    name?: string | null;
    members?: number;
    petName?: string | null;
    noSpace?: boolean;
    petStatus?: "NONE" | "PENDING" | "ACTIVE" | "PAUSED";
    petSetupComplete?: boolean;
  } = {},
): Me => ({
  profile: {
    id: "a",
    email: "a@x.dev",
    displayName: over.name === undefined ? "A" : over.name,
    avatarUrl: null,
    timezone: "UTC",
  },
  space: over.noSpace
    ? null
    : {
        id: "s",
        name: "s",
        togetherSince: null,
        timezone: "UTC",
        status: "active",
        createdAt: "",
        petSetupComplete: over.petSetupComplete,
        members: Array.from({ length: over.members ?? 2 }, (_, i) => member(`m${i}`)),
        pet: {
          status: over.petStatus ?? "ACTIVE",
          decisionId: null,
          decisionById: null,
          proposedEnabled: null,
          bond: 0,
          id: "p",
          species: "dog",
          name: over.petName === undefined ? "Mochi" : over.petName,
          proposedName: null,
          proposedById: null,
          stage: "baby",
          mood: "happy",
          hatchedAt: null,
          ageDays: 0,
          wellbeing: {
            fullness: { value: 0.5, word: "content" },
            energy: { value: 0.5, word: "playful" },
            love: { value: 0.5, word: "loved" },
            lastCare: [],
          },
        },
      },
});

describe("flowState", () => {
  test("loading only when nothing is known yet", () => {
    expect(flowState(false, true, undefined)).toBe("loading");
  });
  test("cached profile is trusted while the session revalidates", () => {
    expect(flowState(false, true, me())).toBe("ready");
  });
  test("resolved session is authoritative", () => {
    expect(flowState(false, false, me())).toBe("signed-out");
    expect(flowState(true, false, undefined)).toBe("loading");
  });
  test("journey steps", () => {
    expect(flowState(true, false, me({ name: null }))).toBe("needs-name");
    expect(flowState(true, false, me({ noSpace: true }))).toBe("no-space");
    expect(flowState(true, false, me({ members: 1 }))).toBe("waiting");
    expect(flowState(true, false, me({ petName: null }))).toBe("naming");
    expect(flowState(true, false, me())).toBe("ready");
  });
  test("a paired space opens before an optional pet decision, without opting into one", () => {
    for (const petStatus of ["NONE", "PENDING", "PAUSED"] as const) {
      expect(flowState(true, false, me({ petStatus, petName: null, petSetupComplete: false }))).toBe("ready");
      expect(flowState(true, false, me({ petStatus, petName: null, petSetupComplete: true }))).toBe("ready");
    }
  });
  test("active pet still needs a mutually agreed name", () => {
    expect(flowState(true, false, me({ petStatus: "ACTIVE", petName: null, petSetupComplete: true }))).toBe("naming");
    expect(flowState(true, false, me({ petStatus: "ACTIVE", petSetupComplete: false }))).toBe("ready");
  });
});

describe("restorablePath", () => {
  test("restores in-app screens only", () => {
    expect(restorablePath("/pet")).toBe("/pet");
    expect(restorablePath("/settings")).toBe("/settings");
    expect(restorablePath("/today")).toBeNull();
    expect(restorablePath("/hatch")).toBeNull();
    expect(restorablePath("/pet-choice")).toBeNull();
    expect(restorablePath("/invite/ABCD")).toBeNull();
    expect(restorablePath(null)).toBeNull();
  });
});

import { describe, expect, test } from "bun:test";
import type { Me } from "@lovenotes/contracts";
import { flowState, restorablePath } from "./flow";

const member = (id: string) => ({ id, displayName: id, avatarUrl: null, role: "member" as const, joinedAt: "" });
const me = (over: { name?: string | null; members?: number; petName?: string | null; noSpace?: boolean } = {}): Me => ({
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
        members: Array.from({ length: over.members ?? 2 }, (_, i) => member(`m${i}`)),
        pet: {
          id: "p",
          species: "dog",
          name: over.petName === undefined ? "Mochi" : over.petName,
          proposedName: null,
          proposedById: null,
          stage: "baby",
          mood: "happy",
          hatchedAt: null,
          ageDays: 0,
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
});

describe("restorablePath", () => {
  test("restores in-app screens only", () => {
    expect(restorablePath("/pet")).toBe("/pet");
    expect(restorablePath("/settings")).toBe("/settings");
    expect(restorablePath("/today")).toBeNull();
    expect(restorablePath("/hatch")).toBeNull();
    expect(restorablePath("/invite/ABCD")).toBeNull();
    expect(restorablePath(null)).toBeNull();
  });
});

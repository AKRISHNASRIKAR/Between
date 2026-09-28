import { describe, expect, test } from "bun:test";
import { SAMPLE_WIDGET_SNAPSHOT as S } from "@lovenotes/contracts";
import { petArtFor, toUsWidgetProps } from "./props";

describe("widget props", () => {
  test("notes waiting take focus and deep-link to Notes", () => {
    const p = toUsWidgetProps(S, "file:///x.png");
    expect(p.focusLine).toBe("2 notes from Ananya");
    expect(p.url).toBe("lovenotes://notes");
    expect(p.partnerVibe).toBe("Excited");
  });
  test("with nothing waiting, the daily question is next", () => {
    expect(toUsWidgetProps({ ...S, notesWaiting: 0 }, "").url).toBe("lovenotes://daily");
  });
  test("signed out shows no one's data", () => {
    const p = toUsWidgetProps(null, "");
    expect([p.youVibe, p.partnerName, p.partnerVibe]).toEqual([null, null, null]);
  });
  test("pet art follows stage and mood", () => {
    expect(petArtFor({ ...S, pet: { ...S.pet, stage: "egg" } })).toBe("egg");
    expect(petArtFor({ ...S, pet: { ...S.pet, mood: "sleepy" } })).toBe("sleepy");
    expect(petArtFor(S)).toBe("awake");
  });
});

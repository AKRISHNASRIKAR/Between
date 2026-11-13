import { describe, expect, test } from "bun:test";
import { SAMPLE_WIDGET_SNAPSHOT as S } from "@lovenotes/contracts";
import { petArtFor, toUsWidgetProps } from "./props";

describe("widget props", () => {
  test("notes waiting take focus and deep-link to Notes", () => {
    const p = toUsWidgetProps(S, "file:///x.png", Date.parse(S.generatedAt));
    expect(p.focusLine).toBe("2 notes from Ananya");
    expect(p.url).toBe("lovenotes://notes?source=widget");
    expect(p.partnerVibe).toBe("Excited");
  });
  test("with nothing waiting, the daily question is next", () => {
    expect(toUsWidgetProps({ ...S, notesWaiting: 0 }, "", Date.parse(S.generatedAt)).url).toBe(
      "lovenotes://daily?source=widget",
    );
  });
  test("no pet remains a complete relationship widget", () => {
    const p = toUsWidgetProps({ ...S, pet: null }, "", Date.parse(S.generatedAt));
    expect(p.hasPet).toBe(false);
    expect(p.partnerVibe).toBe("Excited");
    expect(p.petName).toBe("Between");
  });
  test("quiz deep links use the actual session", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      toUsWidgetProps({ ...S, notesWaiting: 0, daily: "ready", dailyId: id }, "", Date.parse(S.generatedAt)).url,
    ).toBe(`lovenotes://quiz/${id}?source=widget`);
  });
  test("stale content asks for a refresh instead of showing current moods", () => {
    const p = toUsWidgetProps(S, "", Date.parse(S.generatedAt) + 24 * 3600000);
    expect(p.youVibe).toBeNull();
    expect(p.hasPet).toBe(false);
    expect(p.focusLine).toContain("latest");
  });
  test("memories outrank mood prompts and optional pet content", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const p = toUsWidgetProps(
      { ...S, pet: null, notesWaiting: 0, daily: "done", memoryId: id },
      "",
      Date.parse(S.generatedAt),
    );
    expect(p.url).toBe(`lovenotes://journal/${id}?source=widget`);
    expect(p.memoryLine).toContain("last year");
  });
  test("closed spaces never nudge a quiz or pet", () => {
    const p = toUsWidgetProps({ ...S, state: "closed" }, "", Date.parse(S.generatedAt));
    expect(p.focusLine).toBe("This space is resting");
    expect(p.url).toBe("lovenotes://today?source=widget");
  });
  test("signed out shows no one's data", () => {
    const p = toUsWidgetProps(null, "");
    expect([p.youVibe, p.partnerName, p.partnerVibe]).toEqual([null, null, null]);
  });
  test("pet art follows stage and mood", () => {
    if (!S.pet) throw new Error("Sample requires a pet");
    expect(petArtFor({ ...S, pet: { ...S.pet, stage: "egg" } })).toBe("egg");
    expect(petArtFor({ ...S, pet: { ...S.pet, mood: "sleepy" } })).toBe("sleepy");
    expect(petArtFor(S)).toBe("awake");
  });
});

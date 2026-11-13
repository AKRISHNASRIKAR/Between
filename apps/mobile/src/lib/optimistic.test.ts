import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { rollbackOptimistic } from "./optimistic";

const key = ["space", "s", "vibe", "day", "2026-10-07"];

test("first-use failure removes optimistic data when the previous cache was absent", () => {
  const qc = new QueryClient();
  qc.setQueryData(key, { mood: "happy" });
  const optimistic = qc.getQueryData<{ mood: string }>(key);
  rollbackOptimistic(qc, key, { prev: undefined, optimistic });
  expect(qc.getQueryData<{ mood: string }>(key)).toBeUndefined();
  expect(qc.getQueryCache().find({ queryKey: key, exact: true })).toBeUndefined();
  qc.clear();
});

test("failure restores existing data while this mutation owns the cache", () => {
  const qc = new QueryClient();
  const prev = { mood: "calm" };
  qc.setQueryData(key, prev);
  qc.setQueryData(key, { mood: "happy" });
  rollbackOptimistic(qc, key, { prev, optimistic: qc.getQueryData<{ mood: string }>(key) });
  expect(qc.getQueryData<{ mood: string }>(key)).toEqual(prev);
  qc.clear();
});

test("an older failure cannot roll back a newer concurrent edit or realtime update", () => {
  const qc = new QueryClient();
  const prev = { mood: "calm" };
  qc.setQueryData(key, { mood: "happy" });
  const first = { prev, optimistic: qc.getQueryData<{ mood: string }>(key) };
  qc.setQueryData(key, { mood: "sleepy" });
  rollbackOptimistic(qc, key, first);
  expect(qc.getQueryData<{ mood: string }>(key)).toEqual({ mood: "sleepy" });
  qc.setQueryData(key, { mood: "excited" });
  rollbackOptimistic(qc, key, first);
  expect(qc.getQueryData<{ mood: string }>(key)).toEqual({ mood: "excited" });
  qc.clear();
});

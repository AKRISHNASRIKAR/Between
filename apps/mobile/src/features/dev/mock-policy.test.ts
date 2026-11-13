import { expect, test } from "bun:test";
import { allowsMockConnections, isMockEmail } from "./mock-policy";

test("mock connections fail closed outside a local development service", () => {
  for (const url of [
    "https://api.example.com",
    "http://localhost.attacker.test:3000",
    "http://192.168.1.2:3000",
    "http://user:secret@localhost:3000",
    "not a url",
  ])
    expect(allowsMockConnections(true, url)).toBe(false);
  expect(allowsMockConnections(false, "http://localhost:3000")).toBe(false);
  for (const url of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"])
    expect(allowsMockConnections(true, url)).toBe(true);
});
test("real account names are never classified as synthetic connections", () => {
  expect(isMockEmail("sam@example.com")).toBe(false);
  expect(isMockEmail("partner-random@dev.local")).toBe(false);
  expect(isMockEmail("between-ui-active-00000000-0000-4000-8000-000000000001@dev.local")).toBe(true);
});

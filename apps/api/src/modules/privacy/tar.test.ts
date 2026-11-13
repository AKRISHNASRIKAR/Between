import { expect, test } from "bun:test";
import { tarFile, tarHeader } from "./tar";

test("tar headers reject traversal and contain the actual byte size and valid checksum", () => {
  expect(() => tarHeader("../secret", 5)).toThrow();
  expect(() => tarHeader("/secret", 5)).toThrow();
  const header = tarHeader("media/photo/main.png", 777);
  expect(Number.parseInt(Buffer.from(header.subarray(124, 136)).toString(), 8)).toBe(777);
  const checksum = Number.parseInt(Buffer.from(header.subarray(148, 154)).toString(), 8);
  const copy = header.slice();
  copy.fill(32, 148, 156);
  expect(checksum).toBe(copy.reduce((sum, byte) => sum + byte, 0));
});

test("tar regular files have aligned padding and exact bytes", async () => {
  const chunks = [];
  for await (const chunk of tarFile("between.json", new TextEncoder().encode("hello"))) chunks.push(chunk);
  expect(chunks.map((chunk) => chunk.byteLength)).toEqual([512, 5, 507]);
  expect(Buffer.from(chunks[1] ?? []).toString()).toBe("hello");
});

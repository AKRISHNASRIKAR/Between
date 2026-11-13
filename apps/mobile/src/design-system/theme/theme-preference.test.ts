import { describe, expect, test } from "bun:test";
import { decodeAppearance, encodeAppearance, resolveAppearance } from "./theme-preference";
import { COLOR_THEMES } from "./themes";

describe("appearance preference", () => {
  test("upgrades old brightness preferences without forcing system appearance", () => {
    expect(decodeAppearance("light")).toEqual({ colorTheme: "postcard", appearance: "light" });
    expect(decodeAppearance("candlelit")).toEqual({ colorTheme: "postcard", appearance: "dark" });
    expect(decodeAppearance("system")).toEqual({ colorTheme: "postcard", appearance: "system" });
  });

  test("persists color choice and brightness together", () => {
    const choice = { colorTheme: "rose", appearance: "dark" } as const;
    expect(decodeAppearance(encodeAppearance(choice))).toEqual(choice);
  });

  test("corrupt, missing and unsupported versions fall back safely", () => {
    for (const raw of [null, "", "not json", "null", "[]", '"light"', '{"version":2,"colorTheme":"rose"}'])
      expect(decodeAppearance(raw)).toEqual({ colorTheme: "postcard", appearance: "system" });
    expect(decodeAppearance('{"version":1,"colorTheme":"__proto__","appearance":"dark"}')).toEqual({
      colorTheme: "postcard",
      appearance: "dark",
    });
    expect(decodeAppearance('{"version":1,"colorTheme":"garden","appearance":"candlelit"}')).toEqual({
      colorTheme: "garden",
      appearance: "system",
    });
  });

  test("system changes keep each color palette and explicit brightness overrides the phone", () => {
    for (const theme of COLOR_THEMES) {
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "system" }, "light")).toBe(theme.light);
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "system" }, "dark")).toBe(theme.dark);
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "system" }, null)).toBe(theme.light);
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "system" }, "unspecified")).toBe(theme.light);
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "light" }, "dark")).toBe(theme.light);
      expect(resolveAppearance({ colorTheme: theme.id, appearance: "dark" }, "light")).toBe(theme.dark);
    }
  });
});

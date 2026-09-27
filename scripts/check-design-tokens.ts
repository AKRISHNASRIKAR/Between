/**
 * DESIGN.md §13: colors, font sizes and font families live only in the design system.
 * Fails if any mobile source outside `design-system/` hardcodes them.
 */
import { Glob } from "bun";

const root = "apps/mobile/src";
const rules: Array<[RegExp, string]> = [
  [/#[0-9a-fA-F]{3,8}\b/, "hex color"],
  [/\brgba?\(/, "rgb color"],
  [/\bfontSize\s*:/, "fontSize"],
  [/\bfontFamily\s*:/, "fontFamily"],
  [/\b(?:text|bg|border)-\[#/, "arbitrary Tailwind color"],
];

/** Spacing utilities must use the DESIGN.md scale — Tailwind silently ignores unknown keys. */
const SPACE_KEYS = new Set(["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20"]);
const spacingClass =
  /(?:^|[\s"'`])-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|top|bottom|left|right|inset|space-x|space-y)-(\d+)(?=[\s"'`])/g;

let failures = 0;
for await (const file of new Glob("**/*.{ts,tsx}").scan(root)) {
  if (file.startsWith("design-system/")) continue;
  const lines = (await Bun.file(`${root}/${file}`).text()).split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(spacingClass)) {
      if (!SPACE_KEYS.has(m[1] ?? "")) {
        console.error(`${root}/${file}:${i + 1}  spacing class "${m[0].trim()}" is not on the DESIGN.md scale`);
        failures++;
      }
    }
    if (/<Animated\.[A-Za-z]+[^>]*\bclassName=/.test(line)) {
      console.error(`${root}/${file}:${i + 1}  className on an Animated component is ignored — use style`);
      failures++;
    }
    for (const [re, what] of rules) {
      if (re.test(line)) {
        console.error(`${root}/${file}:${i + 1}  ${what} outside design-system → use DESIGN.md tokens`);
        failures++;
      }
    }
  });
}
if (failures) process.exit(1);
console.log("design tokens ✓");

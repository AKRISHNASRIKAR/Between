/**
 * Every theme must stay readable (DESIGN §2, WCAG 2.1 AA). Checks each text/background pairing
 * the components actually use, in every theme in apps/mobile/src/design-system/theme/themes.ts.
 * Fails the lint with the pair and its ratio.
 */
import { FAMILIES, QUIZ_SWATCHES, THEMES } from "../apps/mobile/src/design-system/theme/themes";

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

const AA = 4.5;
const problems: string[] = [];
const check = (theme: string, what: string, fg: string, bg: string, min = AA) => {
  const r = ratio(fg, bg);
  if (r < min) problems.push(`${theme}: ${what} is ${r.toFixed(2)}:1 (needs ${min}:1)`);
};

let pairs = 0;
for (const [name, t] of Object.entries(THEMES)) {
  const f = t.foundation;
  for (const surface of ["canvas", "paper", "sunken"] as const)
    for (const text of ["ink", "ink-secondary", "ink-tertiary"] as const) {
      check(name, `${text} on ${surface}`, f[text], f[surface]);
      pairs++;
    }
  check(name, "on-ink on ink", f["on-ink"], f.ink);
  pairs++;
  for (const fam of FAMILIES) {
    const s = t.families[fam];
    check(name, `${fam}-deep on canvas`, s.deep, f.canvas);
    check(name, `${fam}-deep on ${fam}-soft`, s.deep, s.soft);
    check(name, `ink on ${fam}-soft`, f.ink, s.soft);
    const onBase = fam === "teal" ? f["on-teal"] : f["on-accent"];
    check(name, `${fam === "teal" ? "on-teal" : "on-accent"} on ${fam}-base`, onBase, s.base);
    pairs += 4;
  }
  for (const [stock, bg] of Object.entries(t.notes)) {
    check(name, `ink on note-${stock}`, f.ink, bg);
    pairs++;
  }
}
for (const [k, s] of Object.entries(QUIZ_SWATCHES)) {
  check("quiz", `${k} text on fill`, s.text, s.fill);
  pairs++;
}

if (problems.length) {
  console.error(`✗ theme contrast: ${problems.length} of ${pairs} pairs fail\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.info(`✓ theme contrast: ${pairs} pairs across ${Object.keys(THEMES).length} themes pass AA`);

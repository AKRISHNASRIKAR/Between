/**
 * Generates the Love Notes app icon family from one drawing: Mochi peeking over a sealed
 * love note, in the swatch-board palette and the app's clean illustration style (no outlines,
 * a shade crescent for depth). Mochi reuses the in-app pet paths, so the icon's
 * pet is the same one people meet in the app.
 *
 *   bun scripts/make-icon.ts            → writes apps/mobile/assets/*.png and assets/logo.svg
 *
 * Rasterising needs @resvg/resvg-js (not a project dependency): set RESVG=<path to the package>.
 */
import { PET } from "../apps/mobile/src/design-system/illustrations/pet/paths";
import { palette } from "../apps/mobile/src/design-system/tokens";

const C = {
  bg: "#FF7BAC", // bubblegum
  bgDeep: "#F25C95",
  ink: palette.ink,
  body: "#F4D242", // pure sun
  ear: palette["orange-base"], // apricot jam
  cheek: "#FF7BAC",
  paper: palette.paper,
  fold: palette["line-strong"],
  seal: palette["tomato-deep"], // cherry
};

const S = 3.9; // pet scale (200 box → ~780)
const petAt = (tx: number, ty: number) => `translate(${tx} ${ty}) scale(${S})`;

/** Same derivation as the app (design-system/illustrations/soft.tsx): a fill's shade tone. */
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x
    .map((v, i) =>
      Math.round(v + ((y[i] ?? v) - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};
const shadeOf = (fill: string) => mix(fill, palette.ink, 0.13);

let uid = 0;
/**
 * The app's clean illustration style as SVG markup: the shape in its shade tone, then the fill
 * shifted up-left inside a clip of itself (a crisp crescent along the lower-right edge), plus an
 * optional highlight. No outlines.
 */
function soft(d: string, fill: string, lift: number, gloss?: [number, number, number, number]) {
  const id = `s${++uid}`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${shadeOf(fill)}"/>
    <g clip-path="url(#${id})">
      <path d="${d}" fill="${fill}" transform="translate(${-lift * 0.6} ${-lift})"/>
      ${gloss ? `<ellipse cx="${gloss[0]}" cy="${gloss[1]}" rx="${gloss[2]}" ry="${gloss[3]}" fill="${palette.paper}" opacity="0.38" transform="rotate(-24 ${gloss[0]} ${gloss[1]})"/>` : ""}
    </g>`;
}

/** Mochi in the in-app 200×200 pet box, drawn exactly like Mochi.tsx (feet optional). */
function mochiBox(opts: { mono?: boolean; sleepy?: boolean; feet?: boolean } = {}) {
  const { mono = false, sleepy = false, feet = false } = opts;
  if (mono)
    return `${feet ? `<path d="${PET.footL}" fill="#000"/><path d="${PET.footR}" fill="#000"/>` : ""}
      <path d="${PET.body}" fill="#000"/><path d="${PET.earL}" fill="#000"/><path d="${PET.earR}" fill="#000"/>`;
  const eyes = sleepy
    ? `<path d="M ${PET.eyeL.x - 7} ${PET.eyeL.y} Q ${PET.eyeL.x} ${PET.eyeL.y + 6} ${PET.eyeL.x + 7} ${PET.eyeL.y} M ${PET.eyeR.x - 7} ${PET.eyeR.y} Q ${PET.eyeR.x} ${PET.eyeR.y + 6} ${PET.eyeR.x + 7} ${PET.eyeR.y}" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/>`
    : `<ellipse cx="${PET.eyeL.x}" cy="${PET.eyeL.y}" rx="6" ry="7.5" fill="${C.ink}"/>
    <ellipse cx="${PET.eyeR.x}" cy="${PET.eyeR.y}" rx="6" ry="7.5" fill="${C.ink}"/>
    <circle cx="${PET.eyeL.x + 2}" cy="${PET.eyeL.y - 2.6}" r="2.2" fill="${C.paper}"/>
    <circle cx="${PET.eyeR.x + 2}" cy="${PET.eyeR.y - 2.6}" r="2.2" fill="${C.paper}"/>`;
  return `
    ${feet ? `<path d="${PET.footL}" fill="${shadeOf(C.body)}"/><path d="${PET.footR}" fill="${shadeOf(C.body)}"/>` : ""}
    ${soft(PET.body, C.body, 7, [70, 88, 16, 7])}
    <ellipse cx="${PET.cheekL.x}" cy="${PET.cheekL.y}" rx="8.5" ry="5.5" fill="${C.cheek}" opacity="0.6"/>
    <ellipse cx="${PET.cheekR.x}" cy="${PET.cheekR.y}" rx="8.5" ry="5.5" fill="${C.cheek}" opacity="0.6"/>
    ${eyes}
    <path d="${PET.nose}" fill="${C.ink}"/>
    <path d="${sleepy ? PET.mouth.content : PET.mouth.happy}" fill="none" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${soft(PET.earL, C.ear, 5)}
    ${soft(PET.earR, C.ear, 5)}`;
}

/** Mochi from the waist up; the envelope in front hides the rest. */
const mochi = (mono = false) => `<g transform="${petAt(122, -95)}">${mochiBox({ mono })}</g>`;

const HEART =
  "M 512 792 C 470 760 452 730 470 706 C 486 686 508 694 512 712 C 516 694 538 686 554 706 C 572 730 554 760 512 792 Z";
const ENVELOPE =
  "M 246 540 H 778 A 40 40 0 0 1 818 580 V 864 A 40 40 0 0 1 778 904 H 246 A 40 40 0 0 1 206 864 V 580 A 40 40 0 0 1 246 540 Z";

/** The sealed note Mochi is holding, with two paws over its top edge. */
function note(mono = false) {
  const pawD = (cx: number) => `M ${cx - 54} 548 A 54 38 0 1 0 ${cx + 54} 548 A 54 38 0 1 0 ${cx - 54} 548 Z`;
  if (mono)
    return `<path d="${ENVELOPE}" fill="#000"/><path d="${pawD(392)}" fill="#000"/><path d="${pawD(632)}" fill="#000"/>`;
  const paw = (cx: number) => `${soft(pawD(cx), C.body, 8)}
    <path d="M ${cx - 16} 536 V 554 M ${cx + 16} 536 V 554" stroke="${shadeOf(shadeOf(C.body))}" stroke-width="8" stroke-linecap="round"/>`;
  return `
  <rect x="226" y="562" width="600" height="360" rx="44" fill="${C.bgDeep}" opacity="0.55"/>
  ${soft(ENVELOPE, C.paper, 16)}
  <path d="M 236 572 L 512 752 L 788 572" fill="none" stroke="${C.fold}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 236 880 L 420 734 M 788 880 L 604 734" fill="none" stroke="${C.fold}" stroke-width="10" stroke-linecap="round"/>
  ${soft(HEART, C.seal, 10, [482, 718, 12, 6])}
  ${paw(392)}
  ${paw(632)}`;
}

const mark = (mono = false) => `${mochi(mono)}${note(mono)}`;

/** The full-bleed App Store icon (iOS masks the corners itself). */
export const iconSvg =
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <title>Love Notes</title>
  <rect width="1024" height="1024" fill="${C.bg}"/>
  <circle cx="820" cy="190" r="26" fill="${C.paper}" opacity="0.55"/>
  <circle cx="190" cy="300" r="16" fill="${C.paper}" opacity="0.45"/>
  ${mark()}
</svg>`;

/** Android adaptive foreground: the mark shrunk into the 66% safe zone, transparent around it. */
const inset = (inner: string, scale: number) =>
  `<g transform="translate(${512 - 512 * scale} ${512 - 512 * scale}) scale(${scale})">${inner}</g>`;
const fg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  ${inset(mark(), 0.62)}
</svg>`;

/**
 * Android themed icon: one colour, alpha only. The silhouette with the face, folds and heart
 * cut out, so it still reads as Mochi holding a note when the launcher tints it.
 */
const monoFg = () => {
  const cut = `
    <g transform="${petAt(122, -95)}" fill="#000" stroke="#000" stroke-linecap="round">
      <ellipse cx="${PET.eyeL.x}" cy="${PET.eyeL.y}" rx="6.5" ry="8" stroke="none"/>
      <ellipse cx="${PET.eyeR.x}" cy="${PET.eyeR.y}" rx="6.5" ry="8" stroke="none"/>
      <path d="${PET.nose}" stroke-width="1.5"/>
      <path d="${PET.mouth.happy}" fill="none" stroke-width="3"/>
      <path d="${PET.earL}" fill="none" stroke-width="3.5"/>
      <path d="${PET.earR}" fill="none" stroke-width="3.5"/>
    </g>
    <g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 232 566 L 512 752 L 792 566" stroke-width="16"/>
      <path d="M 232 880 L 420 730 M 792 880 L 604 730" stroke-width="14"/>
      <ellipse cx="392" cy="548" rx="60" ry="44" stroke-width="16"/>
      <ellipse cx="632" cy="548" rx="60" ry="44" stroke-width="16"/>
    </g>
    <path d="M 512 792 C 470 760 452 730 470 706 C 486 686 508 694 512 712 C 516 694 538 686 554 706 C 572 730 554 760 512 792 Z" fill="#000"/>`;
  const silhouette = mark(true).replaceAll('fill="#000"', 'fill="#fff"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#000"/>
    ${inset(silhouette + cut, 0.62)}
  </mask></defs>
  <rect width="1024" height="1024" fill="#000" mask="url(#m)"/>
</svg>`;
};
const bg = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="${C.bg}"/></svg>`;
/** Splash: the mark inside a bubblegum disc, on the cream splash background. */
const splash = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <circle cx="512" cy="512" r="500" fill="${C.bg}"/>
  ${inset(mark(), 0.8)}
</svg>`;

/**
 * Pet art for the home-screen widgets: the whole pet (not just the head), transparent, square.
 * Widgets can't run the app's SVG renderer, so they show these pictures instead.
 */
const petArt = (kind: "awake" | "sleepy" | "egg") => {
  // Centre the pet box's content (x 34–166, y 70–171; the egg y 44–176) in an 840 square, filling most of it.
  const body =
    kind === "egg"
      ? `<g transform="translate(-140 -196) scale(5.6)">
          ${soft(PET.egg.whole, palette["butter-soft"], 7, [82, 78, 12, 6])}
          ${PET.egg.speckles.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${palette[d.c]}"/>`).join("")}
        </g>`
      : `<g transform="translate(-160 -276) scale(5.8)">${mochiBox({ sleepy: kind === "sleepy", feet: true })}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 840" width="840" height="840">${body}</svg>`;
};

if (import.meta.main) {
  const { Resvg } = await import(process.env.RESVG ?? "@resvg/resvg-js");
  const root = new URL("../apps/mobile/assets/", import.meta.url).pathname;
  const png = (svg: string, size: number) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  const out: Array<[string, string, number]> = [
    ["icon.png", iconSvg(), 1024],
    ["android-icon-foreground.png", fg(), 1024],
    ["android-icon-background.png", bg(), 1024],
    ["android-icon-monochrome.png", monoFg(), 1024],
    ["splash-icon.png", splash(), 1024],
    ["favicon.png", iconSvg(), 48],
  ];
  for (const [name, svg, size] of out) await Bun.write(root + name, png(svg, size));
  for (const kind of ["awake", "sleepy", "egg"] as const)
    await Bun.write(`${root}widget/pet-${kind}.png`, png(petArt(kind), 360));
  await Bun.write(`${root}logo.svg`, iconSvg());
  console.info(`icons → ${root} (${out.map((o) => o[0]).join(", ")}, logo.svg)`);
}

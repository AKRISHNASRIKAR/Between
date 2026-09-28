/**
 * Generates the Love Notes app icon family from one drawing: Mochi peeking over a sealed
 * love note, in the swatch-board palette. Mochi reuses the in-app pet paths, so the icon's
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

/** Mochi from the waist up; the envelope in front hides the rest. */
function mochi(mono = false) {
  const f = (c: string) => (mono ? "#000" : c);
  const line = mono ? "none" : C.ink;
  const riso = (d: string, fill: string) =>
    mono
      ? `<path d="${d}" fill="#000"/>`
      : `<path d="${d}" fill="${fill}" transform="translate(2.2 2.2)"/><path d="${d}" fill="none" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>`;
  const face = mono
    ? ""
    : `
    <circle cx="${PET.cheekL.x}" cy="${PET.cheekL.y}" r="8" fill="${C.cheek}" opacity="0.7"/>
    <circle cx="${PET.cheekR.x}" cy="${PET.cheekR.y}" r="8" fill="${C.cheek}" opacity="0.7"/>
    <circle cx="${PET.eyeL.x}" cy="${PET.eyeL.y}" r="6.5" fill="${C.ink}"/>
    <circle cx="${PET.eyeR.x}" cy="${PET.eyeR.y}" r="6.5" fill="${C.ink}"/>
    <circle cx="${PET.eyeL.x + 2.2}" cy="${PET.eyeL.y - 2.2}" r="2" fill="${C.paper}"/>
    <circle cx="${PET.eyeR.x + 2.2}" cy="${PET.eyeR.y - 2.2}" r="2" fill="${C.paper}"/>
    <path d="${PET.nose}" fill="${C.ink}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${PET.mouth.happy}" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
  return `<g transform="${petAt(122, -95)}">
    ${riso(PET.body, f(C.body))}
    ${riso(PET.earL, f(C.ear))}
    ${riso(PET.earR, f(C.ear))}
    ${face}
  </g>`;
}

/** The sealed note Mochi is holding, with two paws over its top edge. */
function note(mono = false) {
  const fill = mono ? "#000" : C.paper;
  const line = mono ? "none" : C.ink;
  const heart =
    "M 512 792 C 470 760 452 730 470 706 C 486 686 508 694 512 712 C 516 694 538 686 554 706 C 572 730 554 760 512 792 Z";
  const paw = (cx: number) =>
    mono
      ? `<ellipse cx="${cx}" cy="548" rx="54" ry="38" fill="#000"/>`
      : `<ellipse cx="${cx + 8}" cy="556" rx="54" ry="38" fill="${C.body}"/><ellipse cx="${cx}" cy="548" rx="54" ry="38" fill="${C.body}" stroke="${C.ink}" stroke-width="12"/>
         <path d="M ${cx - 16} 534 L ${cx - 16} 556 M ${cx + 16} 534 L ${cx + 16} 556" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  return `
  ${mono ? "" : `<rect x="222" y="556" width="600" height="360" rx="40" fill="${C.bgDeep}"/>`}
  <rect x="206" y="540" width="612" height="364" rx="40" fill="${fill}" ${mono ? "" : `stroke="${line}" stroke-width="14"`}/>
  ${
    mono
      ? ""
      : `<path d="M 232 566 L 512 752 L 792 566" fill="none" stroke="${C.fold}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 232 880 L 420 730 M 792 880 L 604 730" fill="none" stroke="${C.fold}" stroke-width="10" stroke-linecap="round"/>`
  }
  ${mono ? "" : `<path d="${heart}" fill="${C.seal}" transform="translate(8 8)" opacity="0.35"/><path d="${heart}" fill="${C.seal}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>`}
  ${paw(392)}
  ${paw(632)}`;
}

const mark = (mono = false) => `${mochi(mono)}${note(mono)}`;

/** The full-bleed App Store icon (iOS masks the corners itself). */
export const iconSvg =
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
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
      <circle cx="${PET.eyeL.x}" cy="${PET.eyeL.y}" r="7" stroke="none"/>
      <circle cx="${PET.eyeR.x}" cy="${PET.eyeR.y}" r="7" stroke="none"/>
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
  await Bun.write(root + "logo.svg", iconSvg());
  console.info(`icons → ${root} (${out.map((o) => o[0]).join(", ")}, logo.svg)`);
}

import { Defs, Ellipse, G, Mask, Path } from "react-native-svg";
import { palette } from "../tokens";

/**
 * Illustration signature (DESIGN §8): clean, rounded vector shapes. No outlines, no offset
 * print. Depth comes from one crisp shade crescent along the lower-right edge and a small
 * highlight, so every shape reads as smooth and solid at any size.
 */

/** Mix two #rrggbb colours; `t` = share of `b`. Used to derive a shape's shade from its fill. */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x
    .map((v, i) =>
      Math.round(v + ((y[i] ?? v) - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** The shade tone for a fill: the same hue, a little deeper and warmer. */
export const shadeOf = (fill: string) => mix(fill, palette.ink, 0.13);

type Pt = [number, number];

/** A polygon with every corner rounded by `r` (smooth quadratic corners, straight sides). */
export function roundedPolygon(points: Pt[], r: number): string {
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n] as Pt;
    const cur = points[i] as Pt;
    const next = points[(i + 1) % n] as Pt;
    const toward = (from: Pt, to: Pt): Pt => {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(r, len / 2) / len;
      return [from[0] + dx * k, from[1] + dy * k];
    };
    const a = toward(cur, prev);
    const b = toward(cur, next);
    d += `${i === 0 ? "M" : "L"} ${a[0].toFixed(2)} ${a[1].toFixed(2)} Q ${cur[0]} ${cur[1]} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return `${d}Z`;
}

/** Points of an n-pointed star (outer/inner radius), first point straight up. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, n: number): Pt[] {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? outer : inner;
    return [Number((cx + rr * Math.cos(a)).toFixed(2)), Number((cy + rr * Math.sin(a)).toFixed(2))] as Pt;
  });
}

/** A circle as path data (so it can be clipped, shaded and combined with other shapes). */
export const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

/** A rounded rectangle as path data. */
export const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.min(r, w / 2, h / 2);
  return `M ${x + q} ${y} H ${x + w - q} A ${q} ${q} 0 0 1 ${x + w} ${y + q} V ${y + h - q} A ${q} ${q} 0 0 1 ${x + w - q} ${y + h} H ${x + q} A ${q} ${q} 0 0 1 ${x} ${y + h - q} V ${y + q} A ${q} ${q} 0 0 1 ${x + q} ${y} Z`;
};

/**
 * A filled shape with its shade crescent: the shape in its shade tone, then the fill shifted
 * up-left inside a mask of itself, which leaves a clean crescent along the lower-right edge.
 * `id` must be unique within its <Svg>.
 */
export function SoftShape({
  id,
  d,
  fill,
  shade = shadeOf(fill),
  lift = 4,
  gloss,
}: {
  id: string;
  d: string;
  fill: string;
  shade?: string;
  /** crescent thickness in viewBox units */
  lift?: number;
  /** optional highlight ellipse, in viewBox units */
  gloss?: { cx: number; cy: number; rx: number; ry: number };
}) {
  // Parts (e.g. overlapping circles) are drawn one by one and the mask is painted white per
  // part, so overlaps always merge into one silhouette. (A multi-shape clipPath XORs overlaps
  // on iOS, which shows the shade through them.)
  const parts = d
    .split(/(?=M )/)
    .map((p) => p.trim())
    .filter(Boolean);
  const shift = `translate(${-lift * 0.6} ${-lift})`;
  return (
    <G>
      <Defs>
        {/* explicit region: the default (a % of the viewport) crops larger boxes like the pet's */}
        <Mask id={id} maskUnits="userSpaceOnUse" x={-1000} y={-1000} width={3000} height={3000}>
          {parts.map((p) => (
            <Path key={p} d={p} fill="#FFFFFF" />
          ))}
        </Mask>
      </Defs>
      {parts.map((p) => (
        <Path key={p} d={p} fill={shade} />
      ))}
      <G mask={`url(#${id})`}>
        {parts.map((p) => (
          <Path key={p} d={p} fill={fill} transform={shift} />
        ))}
        {gloss ? (
          <Ellipse
            cx={gloss.cx}
            cy={gloss.cy}
            rx={gloss.rx}
            ry={gloss.ry}
            fill={palette.paper}
            opacity={0.38}
            transform={`rotate(-24 ${gloss.cx} ${gloss.cy})`}
          />
        ) : null}
      </G>
    </G>
  );
}

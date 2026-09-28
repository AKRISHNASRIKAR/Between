import { G, Path } from "react-native-svg";
import { palette, stroke } from "../tokens";

/** Illustration signature (DESIGN §8): flat fill offset 3 units down-right from a 2-unit ink outline. */
export const RISO_OFFSET = 3;

export function RisoPath({
  d,
  fill,
  line = palette.ink,
  offset = RISO_OFFSET,
}: {
  d: string;
  fill: string;
  /** outline colour; ink by default, the card's text colour on dark quiz fills */
  line?: string;
  offset?: number;
}) {
  return (
    <G>
      <Path d={d} fill={fill} transform={`translate(${offset} ${offset})`} />
      <Path
        d={d}
        fill="none"
        stroke={line}
        strokeWidth={stroke.illustration}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </G>
  );
}

/** Polygon/blob path from polar radius function — for wobbly, hand-made-looking outlines. */
export function polarPath(cx: number, cy: number, r: (theta: number) => number, steps = 72): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rr = r(t);
    const x = (cx + rr * Math.cos(t)).toFixed(2);
    const y = (cy + rr * Math.sin(t)).toFixed(2);
    d += `${i === 0 ? "M" : "L"} ${x} ${y} `;
  }
  return `${d}Z`;
}

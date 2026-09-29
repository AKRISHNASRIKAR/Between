import type { Paper } from "@lovenotes/contracts";
import { Circle, Path, Rect, Svg } from "react-native-svg";
import { shadeOf } from "../illustrations/soft";
import { palette, paperFill, stroke } from "../tokens";

/**
 * Sealed envelope in the note's paper stock with a wax dot (DESIGN §7.3). 200×130 box.
 * Paper edges are drawn in a soft line colour; only the wax seal carries ink, so a wall of
 * envelopes reads as paper, not as a grid of outlines.
 */
export function EnvelopeBody({ paper, width }: { paper: Paper; width: number }) {
  const h = (width * 130) / 200;
  return (
    <Svg width={width} height={h} viewBox="0 0 200 130">
      <Rect
        x={4}
        y={4}
        width={192}
        height={122}
        rx={6}
        fill={paperFill[paper]}
        stroke={palette["line-strong"]}
        strokeWidth={stroke.regular}
      />
      <Path
        d="M 6 124 L 82 70 M 194 124 L 118 70"
        stroke={palette["line-strong"]}
        strokeWidth={stroke.regular}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** The top flap on its own layer, so it can flip open around its top edge. */
export function EnvelopeFlap({ paper, width, sealed = true }: { paper: Paper; width: number; sealed?: boolean }) {
  const h = (width * 130) / 200;
  return (
    <Svg width={width} height={h} viewBox="0 0 200 130">
      <Path
        d="M 6 6 L 100 78 L 194 6 Z"
        fill={paperFill[paper]}
        stroke={palette["line-strong"]}
        strokeWidth={stroke.regular}
        strokeLinejoin="round"
      />
      {sealed ? (
        <>
          {/* wax seal: a clean disc with a soft shade, and a lighter pressed centre */}
          <Circle cx={100} cy={77.5} r={13} fill={shadeOf(palette["pink-base"])} />
          <Circle cx={99} cy={76} r={13} fill={palette["pink-base"]} />
          <Circle cx={99} cy={76} r={6.5} fill={palette["pink-soft"]} opacity={0.55} />
        </>
      ) : null}
    </Svg>
  );
}

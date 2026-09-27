import type { Paper } from "@lovenotes/contracts";
import { Circle, Path, Svg } from "react-native-svg";
import { palette, paperFill, stroke } from "../tokens";

/** Sealed envelope in the note's paper stock with a wax dot (DESIGN §7.3). 200×130 box. */
export function EnvelopeBody({ paper, width }: { paper: Paper; width: number }) {
  const h = (width * 130) / 200;
  return (
    <Svg width={width} height={h} viewBox="0 0 200 130">
      <Path
        d="M 6 6 H 194 V 124 H 6 Z"
        fill={paperFill[paper]}
        stroke={palette.ink}
        strokeWidth={stroke.illustration}
        strokeLinejoin="round"
      />
      <Path
        d="M 6 124 L 82 70 M 194 124 L 118 70"
        stroke={palette.ink}
        strokeWidth={stroke.regular}
        strokeLinecap="round"
        opacity={0.6}
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
        stroke={palette.ink}
        strokeWidth={stroke.illustration}
        strokeLinejoin="round"
      />
      {sealed ? (
        <>
          <Circle cx={100} cy={76} r={13} fill={palette["pink-base"]} transform="translate(2 2)" />
          <Circle cx={100} cy={76} r={13} fill="none" stroke={palette.ink} strokeWidth={stroke.illustration} />
          <Circle cx={100} cy={76} r={6} fill="none" stroke={palette.ink} strokeWidth={1.2} opacity={0.5} />
        </>
      ) : null}
    </Svg>
  );
}

import { Path, Svg } from "react-native-svg";
import { palette } from "../tokens";
import { circle, SoftShape } from "./soft";

/** Pet props in the clean illustration style. */
export function Bowl({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 100 60" accessibilityLabel="Food bowl">
      <SoftShape
        id="kibble"
        d={`${circle(36, 23, 9)} ${circle(52, 19, 10)} ${circle(66, 24, 8)}`}
        fill={palette["orange-base"]}
        lift={2.5}
      />
      <SoftShape
        id="bowl"
        d="M 14 26 H 86 Q 91 26 90 31 C 87 47 71 56 50 56 C 29 56 13 47 10 31 Q 9 26 14 26 Z"
        fill={palette["sky-base"]}
        lift={4}
        gloss={{ cx: 26, cy: 34, rx: 7, ry: 2.5 }}
      />
    </Svg>
  );
}

export function Ball({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="Ball">
      <SoftShape
        id="ball"
        d={circle(20, 20, 16)}
        fill={palette["green-base"]}
        lift={2.5}
        gloss={{ cx: 14, cy: 13, rx: 4, ry: 2.2 }}
      />
      <Path
        d="M 9 11.5 C 16 16 16 25 9.5 29.5 M 31 10.5 C 24 15 24 25 30.5 29.5"
        stroke={palette.paper}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
    </Svg>
  );
}

import { Circle, Path, Svg } from "react-native-svg";
import { palette } from "../tokens";
import { RisoPath } from "./riso";

/** Pet props in the illustration style. */
export function Bowl({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 100 60" accessibilityLabel="Food bowl">
      <Circle cx={36} cy={22} r={9} fill={palette["orange-base"]} stroke={palette.ink} strokeWidth={2} />
      <Circle cx={52} cy={18} r={10} fill={palette["orange-base"]} stroke={palette.ink} strokeWidth={2} />
      <Circle cx={66} cy={23} r={8} fill={palette["orange-base"]} stroke={palette.ink} strokeWidth={2} />
      <RisoPath d="M 10 26 L 90 26 C 88 46 72 56 50 56 C 28 56 12 46 10 26 Z" fill={palette["sky-base"]} />
    </Svg>
  );
}

export function Ball({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="Ball">
      <RisoPath
        d="M 20 4 C 29 4 36 11 36 20 C 36 29 29 36 20 36 C 11 36 4 29 4 20 C 4 11 11 4 20 4 Z"
        fill={palette["green-base"]}
        offset={2}
      />
      <Path
        d="M 8 12 C 16 16 16 26 9 30 M 32 10 C 24 14 24 26 31 30"
        stroke={palette.ink}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

import { MOODS, type MoodId } from "@lovenotes/contracts";
import { Circle, G, Line, Path, Rect, Svg } from "react-native-svg";
import { family, palette, stroke } from "../tokens";
import { polarPath, RisoPath } from "./riso";

type Face = {
  eyes: [number, number][];
  eyeStyle?: "dot" | "closed-happy" | "closed" | "droopy";
  mouth: string;
  brows?: string;
};

function fillFor(mood: MoodId) {
  const def = MOODS[mood];
  if (def.family === "neutral") return palette["line-strong"];
  const f = family(def.family);
  return def.tone === "soft" ? f.soft : f.base;
}

const ink = palette.ink;

/** Shapes live in a 100×100 box. */
const SHAPES: Record<MoodId, { body: string; extra?: (backdrop: string) => React.ReactNode; face: Face }> = {
  joyful: {
    body: polarPath(50, 52, () => 27),
    extra: () => (
      <G stroke={ink} strokeWidth={stroke.illustration} strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          return (
            <Line
              key={a}
              x1={50 + 33 * Math.cos(a)}
              y1={52 + 33 * Math.sin(a)}
              x2={50 + 42 * Math.cos(a)}
              y2={52 + 42 * Math.sin(a)}
            />
          );
        })}
      </G>
    ),
    face: {
      eyes: [
        [42, 49],
        [58, 49],
      ],
      mouth: "M 41 58 Q 50 67 59 58",
    },
  },
  excited: {
    body: polarPath(50, 52, (t) => (Math.round((t / (Math.PI * 2)) * 16) % 2 === 0 ? 40 : 29), 16),
    face: {
      eyes: [
        [43, 48],
        [57, 48],
      ],
      mouth: "M 42 56 Q 50 68 58 56 Z",
    },
  },
  grateful: {
    body: "M 16 40 L 84 40 C 84 64 70 80 50 80 C 30 80 16 64 16 40 Z",
    face: {
      eyes: [
        [40, 54],
        [60, 54],
      ],
      eyeStyle: "closed-happy",
      mouth: "M 44 63 Q 50 68 56 63",
    },
  },
  connected: {
    body: `${polarPath(39, 52, () => 23)} ${polarPath(61, 52, () => 23)}`,
    face: {
      eyes: [
        [34, 49],
        [66, 49],
      ],
      mouth: "M 42 60 Q 50 66 58 60",
    },
  },
  calm: {
    body: "M 14 58 C 14 40 32 32 52 32 C 72 32 87 42 86 58 C 85 72 70 76 50 76 C 30 76 14 72 14 58 Z",
    face: {
      eyes: [
        [40, 54],
        [60, 54],
      ],
      eyeStyle: "closed",
      mouth: "M 45 63 Q 50 66 55 63",
    },
  },
  tired: {
    body: "M 16 66 C 16 40 30 28 50 28 C 70 28 84 40 84 66 C 84 74 79 76 76 70 C 74 80 66 80 64 72 C 60 82 52 80 52 72 C 48 80 40 80 38 72 C 34 78 26 78 24 70 C 20 76 16 74 16 66 Z",
    face: {
      eyes: [
        [40, 52],
        [60, 52],
      ],
      eyeStyle: "droopy",
      mouth: "M 45 62 L 55 62",
    },
  },
  sensitive: {
    body: "M 50 20 A 15 15 0 0 1 80 50 A 15 15 0 0 1 50 80 A 15 15 0 0 1 20 50 A 15 15 0 0 1 50 20 Z",
    face: {
      eyes: [
        [43, 48],
        [57, 48],
      ],
      mouth: "M 45 58 Q 50 55 55 58",
    },
  },
  confused: {
    body: polarPath(50, 52, (t) => 30 + 2.6 * Math.sin(t * 9)),
    face: {
      eyes: [
        [42, 50],
        [58, 50],
      ],
      mouth: "M 42 62 Q 46 58 50 62 Q 54 66 58 62",
      brows: "M 53 40 Q 58 36 63 39",
    },
  },
  stressed: {
    body: polarPath(
      50,
      52,
      (t) => {
        const sq = 30 / Math.max(Math.abs(Math.cos(t)), Math.abs(Math.sin(t)));
        return Math.min(sq, 40) + (Math.round(t * 12) % 2 === 0 ? 3 : -2);
      },
      48,
    ),
    face: {
      eyes: [
        [42, 49],
        [58, 49],
      ],
      mouth: "M 41 62 L 45 59 L 50 62 L 55 59 L 59 62",
      brows: "M 36 42 L 46 44 M 64 42 L 54 44",
    },
  },
  insecure: {
    body: polarPath(50, 56, () => 20),
    extra: (backdrop) => (
      <G>
        <Rect x={10} y={60} width={80} height={24} fill={backdrop} />
        <Line x1={10} y1={60} x2={90} y2={60} stroke={ink} strokeWidth={stroke.illustration} strokeLinecap="round" />
      </G>
    ),
    face: {
      eyes: [
        [44, 50],
        [56, 50],
      ],
      mouth: "",
    },
  },
  hurt: {
    body: "M 22 54 C 20 34 36 24 52 26 C 70 28 82 40 80 58 C 78 74 64 80 48 78 C 32 76 23 68 22 54 Z",
    extra: () => (
      <G transform="rotate(-30 66 36)">
        <Rect x={56} y={31} width={20} height={9} rx={3} fill={palette.paper} stroke={ink} strokeWidth={1.5} />
        <Circle cx={63} cy={35.5} r={0.9} fill={ink} />
        <Circle cx={69} cy={35.5} r={0.9} fill={ink} />
      </G>
    ),
    face: {
      eyes: [
        [42, 52],
        [58, 52],
      ],
      mouth: "M 44 64 Q 50 59 56 64",
    },
  },
  angry: {
    body: "M 50 18 C 52 18 86 76 84 78 C 82 80 18 80 16 78 C 14 76 48 18 50 18 Z",
    face: {
      eyes: [
        [43, 58],
        [57, 58],
      ],
      mouth: "M 44 70 Q 50 65 56 70",
      brows: "M 36 49 L 46 54 M 64 49 L 54 54",
    },
  },
};

function Eyes({ face, color }: { face: Face; color: string }) {
  return (
    <G>
      {face.eyes.map(([x, y]) => {
        const i = `${x}-${y}`;
        switch (face.eyeStyle) {
          case "closed-happy":
            return (
              <Path
                key={i}
                d={`M ${x - 4} ${y + 1} Q ${x} ${y - 4} ${x + 4} ${y + 1}`}
                stroke={color}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            );
          case "closed":
            return (
              <Path
                key={i}
                d={`M ${x - 4} ${y - 1} Q ${x} ${y + 3} ${x + 4} ${y - 1}`}
                stroke={color}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            );
          case "droopy":
            return (
              <G key={i}>
                <Circle cx={x} cy={y + 1} r={2.6} fill={color} />
                <Line
                  x1={x - 4.5}
                  y1={y - 1}
                  x2={x + 4.5}
                  y2={y - 1}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </G>
            );
          default:
            return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
        }
      })}
    </G>
  );
}

type Props = {
  mood: MoodId;
  size?: number;
  /** dim silhouette for "not shared yet" */
  silhouette?: boolean;
  /** Color behind the creature (the "insecure" wall blends into it). */
  backdrop?: string;
};

export function MoodCreature({ mood, size = 96, silhouette, backdrop = palette.canvas }: Props) {
  const shape = SHAPES[mood];
  const fill = silhouette ? palette.line : fillFor(mood);
  const faceColor =
    MOODS[mood].family === "teal" && MOODS[mood].tone === "base" && !silhouette ? palette["on-ink"] : ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={MOODS[mood].label}>
      {silhouette ? (
        <Path d={shape.body} fill={fill} />
      ) : (
        <>
          <RisoPath d={shape.body} fill={fill} />
          {shape.extra?.(backdrop)}
          <Eyes face={shape.face} color={faceColor} />
          {shape.face.brows ? (
            <Path d={shape.face.brows} stroke={faceColor} strokeWidth={2} strokeLinecap="round" fill="none" />
          ) : null}
          {shape.face.mouth ? (
            <Path
              d={shape.face.mouth}
              stroke={faceColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={shape.face.mouth.trim().endsWith("Z") ? faceColor : "none"}
            />
          ) : null}
        </>
      )}
    </Svg>
  );
}

/** Sleeping silhouette used for the partner's "not shared" card. */
export function SleepingCreature({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Not shared yet">
      <Path d={SHAPES.calm.body} fill={palette.line} />
      <Path
        d="M 36 54 Q 40 57 44 54 M 56 54 Q 60 57 64 54"
        stroke={palette["ink-tertiary"]}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 72 22 L 80 22 L 72 30 L 80 30"
        stroke={palette["ink-tertiary"]}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

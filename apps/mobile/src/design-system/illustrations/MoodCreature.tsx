import { MOODS, type MoodId } from "@lovenotes/contracts";
import type { ReactNode } from "react";
import { Circle, Ellipse, G, Path, Rect, Svg } from "react-native-svg";
import { family, palette } from "../tokens";
import { circle, roundedPolygon, roundRect, SoftShape, shadeOf, starPoints } from "./soft";

type Face = {
  eyes: [number, number][];
  eyeStyle?: "dot" | "closed-happy" | "closed" | "droopy";
  mouth?: string;
  /** filled mouth (open smile) instead of a stroke */
  mouthFilled?: boolean;
  brows?: string;
  cheeks?: [number, number][];
};

type Shape = {
  body: string;
  gloss?: { cx: number; cy: number; rx: number; ry: number };
  /** drawn behind the body (sun rays) */
  under?: (fill: string) => ReactNode;
  /** drawn on top of the body (bandage, wall, sweat drop) */
  over?: (backdrop: string) => ReactNode;
  face: Face;
};

function fillFor(mood: MoodId) {
  const def = MOODS[mood];
  if (def.family === "neutral") return palette["line-strong"];
  const f = family(def.family);
  return def.tone === "soft" ? f.soft : f.base;
}

/** Shapes live in a 100×100 box. Smooth geometry only: circles, pills, rounded polygons. */
const SHAPES: Record<MoodId, Shape> = {
  joyful: {
    body: circle(50, 54, 23),
    gloss: { cx: 42, cy: 44, rx: 7, ry: 4 },
    under: (fill) => (
      <G fill={fill}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <Rect key={deg} x={47} y={14} width={6} height={11} rx={3} transform={`rotate(${deg} 50 54)`} />
        ))}
      </G>
    ),
    face: {
      eyes: [
        [43, 52],
        [57, 52],
      ],
      mouth: "M 43 60 Q 50 66 57 60",
      cheeks: [
        [37, 59],
        [63, 59],
      ],
    },
  },
  excited: {
    body: roundedPolygon(starPoints(50, 53, 39, 29, 10), 5),
    gloss: { cx: 40, cy: 40, rx: 8, ry: 4.5 },
    face: {
      eyes: [
        [43, 50],
        [57, 50],
      ],
      mouth: "M 42.5 57 Q 50 68 57.5 57 Z",
      mouthFilled: true,
    },
  },
  grateful: {
    body: "M 21 40 H 79 Q 86 40 85 47 C 82 66 68 78 50 78 C 32 78 18 66 15 47 Q 14 40 21 40 Z",
    gloss: { cx: 30, cy: 49, rx: 7, ry: 3.5 },
    face: {
      eyes: [
        [40, 53],
        [60, 53],
      ],
      eyeStyle: "closed-happy",
      mouth: "M 45 62 Q 50 66 55 62",
      cheeks: [
        [32, 60],
        [68, 60],
      ],
    },
  },
  connected: {
    body: `${circle(38, 54, 22)} ${circle(62, 54, 22)}`,
    gloss: { cx: 29, cy: 44, rx: 6, ry: 3.5 },
    face: {
      eyes: [
        [33, 52],
        [67, 52],
      ],
      mouth: "M 44 61 Q 50 66 56 61",
    },
  },
  calm: {
    body: roundRect(14, 34, 72, 44, 22),
    gloss: { cx: 30, cy: 42, rx: 8, ry: 3.5 },
    face: {
      eyes: [
        [40, 55],
        [60, 55],
      ],
      eyeStyle: "closed",
      mouth: "M 45.5 63 Q 50 66 54.5 63",
    },
  },
  tired: {
    body: "M 18 62 C 18 42 32 30 50 30 C 68 30 82 42 82 62 V 70 Q 82 76 76.5 76 Q 71 76 71 70 V 69 Q 71 65 67 65 Q 63 65 63 69 V 74 Q 63 80 57 80 Q 51 80 51 74 V 71 Q 51 67 47 67 Q 43 67 43 71 V 72 Q 43 77 37.5 77 Q 32 77 32 72 V 70 Q 32 66 28 66 Q 24 66 24 70 Q 24 74 21 74 Q 18 74 18 70 Z",
    gloss: { cx: 34, cy: 40, rx: 7, ry: 3.5 },
    face: {
      eyes: [
        [41, 53],
        [59, 53],
      ],
      eyeStyle: "droopy",
      mouth: "M 46 62 H 54",
    },
  },
  sensitive: {
    body: [circle(50, 36, 15), circle(64, 50, 15), circle(50, 64, 15), circle(36, 50, 15), circle(50, 50, 16)].join(
      " ",
    ),
    gloss: { cx: 42, cy: 29, rx: 5, ry: 3 },
    face: {
      eyes: [
        [44, 49],
        [56, 49],
      ],
      mouth: "M 46 58 Q 50 55.5 54 58",
    },
  },
  confused: {
    body: circle(50, 54, 27),
    gloss: { cx: 39, cy: 42, rx: 7, ry: 4 },
    face: {
      eyes: [
        [42, 52],
        [58, 51],
      ],
      mouth: "M 42 63 Q 46 59.5 50 63 Q 54 66.5 58 63",
      brows: "M 53 42 Q 58 38.5 63 41",
    },
  },
  stressed: {
    body: roundRect(23, 27, 54, 54, 17),
    gloss: { cx: 36, cy: 36, rx: 6, ry: 3.5 },
    over: () => (
      <Path d="M 79 24 C 83 30 85 33 85 36 A 6 6 0 0 1 73 36 C 73 33 75 30 79 24 Z" fill={palette["sky-base"]} />
    ),
    face: {
      eyes: [
        [42, 53],
        [58, 53],
      ],
      mouth: "M 41 65 L 45.5 62 L 50 65 L 54.5 62 L 59 65",
      brows: "M 36 45 L 46 47 M 64 45 L 54 47",
    },
  },
  insecure: {
    body: circle(50, 59, 19),
    gloss: { cx: 43, cy: 50, rx: 5, ry: 3 },
    over: (backdrop) => (
      <G>
        <Rect x={8} y={62} width={84} height={28} rx={6} fill={backdrop} />
        <Rect x={8} y={60} width={84} height={4} rx={2} fill={palette["line-strong"]} />
      </G>
    ),
    face: {
      eyes: [
        [44, 54],
        [56, 54],
      ],
    },
  },
  hurt: {
    body: roundRect(20, 28, 60, 52, 26),
    gloss: { cx: 32, cy: 38, rx: 7, ry: 3.5 },
    over: () => (
      <G transform="rotate(-32 66 38)">
        <Rect x={55} y={33} width={22} height={10} rx={5} fill={palette.paper} />
        <Rect x={63} y={33} width={6} height={10} fill={palette["line"]} />
      </G>
    ),
    face: {
      eyes: [
        [42, 55],
        [58, 55],
      ],
      mouth: "M 45 66 Q 50 62 55 66",
    },
  },
  angry: {
    body: roundedPolygon(
      [
        [50, 18],
        [87, 80],
        [13, 80],
      ],
      12,
    ),
    gloss: { cx: 44, cy: 38, rx: 5, ry: 3 },
    face: {
      eyes: [
        [43, 61],
        [57, 61],
      ],
      mouth: "M 45 71 Q 50 67.5 55 71",
      brows: "M 37 52 L 46 56 M 63 52 L 54 56",
    },
  },
};

const eyePath = (x: number, y: number, style: Face["eyeStyle"]) => {
  switch (style) {
    case "closed-happy":
      return `M ${x - 4} ${y + 1.5} Q ${x} ${y - 3.5} ${x + 4} ${y + 1.5}`;
    case "closed":
      return `M ${x - 4} ${y - 1} Q ${x} ${y + 3} ${x + 4} ${y - 1}`;
    default:
      return null;
  }
};

function FaceView({ face, color }: { face: Face; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: "round" as const, fill: "none" };
  return (
    <G>
      {face.cheeks?.map(([x, y]) => (
        <Ellipse key={`c${x}`} cx={x} cy={y} rx={4} ry={2.6} fill={palette["pink-base"]} opacity={0.55} />
      ))}
      {face.eyes.map(([x, y]) => {
        const d = eyePath(x, y, face.eyeStyle);
        if (d) return <Path key={`e${x}`} d={d} {...stroke} />;
        if (face.eyeStyle === "droopy")
          return (
            <G key={`e${x}`}>
              <Ellipse cx={x} cy={y + 1} rx={2.8} ry={2.4} fill={color} />
              <Path d={`M ${x - 4} ${y - 0.5} H ${x + 4}`} {...stroke} />
            </G>
          );
        return <Ellipse key={`e${x}`} cx={x} cy={y} rx={2.9} ry={3.8} fill={color} />;
      })}
      {face.brows ? <Path d={face.brows} {...stroke} /> : null}
      {face.mouth ? (
        face.mouthFilled ? (
          <Path d={face.mouth} fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        ) : (
          <Path d={face.mouth} {...stroke} strokeLinejoin="round" />
        )
      ) : null}
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
    MOODS[mood].family === "teal" && MOODS[mood].tone === "base" && !silhouette ? palette.paper : palette.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={MOODS[mood].label}>
      {silhouette ? (
        <Path d={shape.body} fill={fill} />
      ) : (
        <>
          {shape.under?.(shadeOf(fill))}
          <SoftShape id={`mood-${mood}`} d={shape.body} fill={fill} gloss={shape.gloss} />
          {shape.over?.(backdrop)}
          <FaceView face={shape.face} color={faceColor} />
        </>
      )}
    </Svg>
  );
}

/** Sleeping silhouette used for the partner's "not shared" card. */
export function SleepingCreature({ size = 96 }: { size?: number }) {
  const tone = palette["ink-tertiary"];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Not shared yet">
      <SoftShape id="sleeping" d={SHAPES.calm.body} fill={palette.line} />
      <Path
        d="M 36 55 Q 40 58.5 44 55 M 56 55 Q 60 58.5 64 55"
        stroke={tone}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 71 18 H 80 L 71 28 H 80"
        stroke={tone}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={64} cy={31} r={1.8} fill={tone} />
    </Svg>
  );
}

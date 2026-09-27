import { Easing, type WithSpringConfig } from "react-native-reanimated";

/** Motion tokens (DESIGN §10.1). */
export const dur = { instant: 100, fast: 180, base: 260, slow: 420, reveal: 700 } as const;

export const ease = {
  out: Easing.bezier(0.2, 0.8, 0.2, 1),
  in: Easing.bezier(0.4, 0, 1, 1),
} as const;

export const spring = {
  snappy: { damping: 20, stiffness: 300, mass: 1 },
  gentle: { damping: 18, stiffness: 180, mass: 1 },
  bouncy: { damping: 11, stiffness: 200, mass: 1 },
} as const satisfies Record<string, WithSpringConfig>;

export const scale = { press: 0.97, select: 1.04 } as const;
export const stagger = 40;

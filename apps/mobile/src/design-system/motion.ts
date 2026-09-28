import { Easing, FadeIn, FadeInDown, FadeOut, type WithSpringConfig, ZoomIn } from "react-native-reanimated";

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

// ── Entrance presets (DESIGN §10.1). Use these instead of ad-hoc springs so every screen moves alike:
// short, eased, no overshoot. Springs are for things the user drags or presses, not for arrivals.

/** Content arriving on screen; `i` staggers siblings (capped so long lists don't crawl in). */
export const enter = (i = 0) =>
  FadeInDown.duration(dur.base)
    .delay(Math.min(i, 6) * stagger)
    .easing(ease.out)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
/** Replacing content in place (speech bubble lines, step changes). */
export const fadeIn = FadeIn.duration(dur.base).easing(ease.out);
export const fadeOut = FadeOut.duration(dur.fast);
/** A reward landing (stamp, reveal score) — a soft pop, not a bounce. */
export const pop = (delay = 0) => ZoomIn.delay(delay).springify().damping(16).stiffness(220);

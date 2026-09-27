import type { Config } from "tailwindcss";
import { palette, radius, space } from "./src/design-system/tokens";

const px = (o: Record<string | number, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `${v}px`]));

/**
 * The theme is REPLACED (not extended) with DESIGN.md tokens, so default Tailwind colors,
 * spacing and radii simply don't exist. Typography goes through <Text variant>, not classes.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Light-only for launch (DESIGN §2.5); "class" lets the app pin the scheme without NativeWind errors.
  darkMode: "class",
  theme: {
    colors: palette,
    spacing: px(space),
    borderRadius: { ...px(radius), full: "9999px" },
    fontSize: {},
    fontFamily: {},
    extend: {
      maxWidth: { content: "560px" },
      borderWidth: { hairline: "1px", DEFAULT: "1.5px", 2: "2px" },
    },
  },
  plugins: [],
} satisfies Config;

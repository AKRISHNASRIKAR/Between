import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  minimumScaleFactor,
  padding,
  resizable,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

/**
 * Props the app hands the widget (see ../props.ts). Everything is precomputed — widget code runs
 * in an isolated runtime with no imports, state or network — including the colours, so the
 * palette still comes from design tokens.
 */
export type UsWidgetProps = {
  hasPet: boolean;
  freshnessLine: string;
  memoryLine: string | null;
  petName: string;
  /** file:// URL of the pet picture in the shared widgets directory */
  petImage: string;
  petLine: string;
  focusLine: string;
  /** deep link opened on tap */
  url: string;
  youVibe: string | null;
  partnerName: string | null;
  partnerVibe: string | null;
  colors: { bg: string; ink: string; muted: string; accent: string; you: string; partner: string };
};

/**
 * The "Us" widget (DESIGN §7.5). Small: the pet and the one thing worth tapping. Medium: plus
 * both of today's vibes. Lock screen: only the pet and counts — never how anyone feels.
 */
const UsWidget = (p: UsWidgetProps, env: WidgetEnvironment) => {
  "widget";
  if (!p?.colors) {
    return (
      <VStack>
        <Text modifiers={[font({ design: "serif", weight: "semibold", size: 16 })]}>Between</Text>
        <Text modifiers={[font({ size: 12 })]}>Open your little corner for two</Text>
      </VStack>
    );
  }
  const c = p.colors;
  const base = [containerBackground(c.bg, "widget"), widgetURL(p.url)];

  if (env.widgetFamily === "accessoryInline") {
    return <Text modifiers={[widgetURL(p.url)]}>{p.focusLine}</Text>;
  }
  if (env.widgetFamily === "accessoryRectangular") {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(p.url)]}>
        <Text modifiers={[font({ design: "serif", weight: "semibold", size: 15 })]}>{p.petName}</Text>
        <Text modifiers={[font({ size: 13 }), minimumScaleFactor(0.8)]}>{p.focusLine}</Text>
      </VStack>
    );
  }

  const pet = (size: number) =>
    p.hasPet ? <Image uiImage={p.petImage} modifiers={[resizable(), frame({ width: size, height: size })]} /> : null;
  const vibeRow = (dot: string, who: string, vibe: string | null) => (
    <HStack spacing={6}>
      <Text modifiers={[font({ size: 10 }), foregroundStyle(dot)]}>●</Text>
      <Text modifiers={[font({ size: 13, weight: "medium", design: "rounded" }), foregroundStyle(c.ink)]}>{who}</Text>
      <Spacer />
      <Text modifiers={[font({ size: 13, design: "serif" }), foregroundStyle(vibe ? c.ink : c.muted)]}>
        {vibe ?? "not shared yet"}
      </Text>
    </HStack>
  );

  if (env.widgetFamily === "systemLarge") {
    return (
      <VStack alignment="leading" spacing={14} modifiers={base}>
        <HStack spacing={12}>
          {pet(90)}
          <VStack alignment="leading" spacing={4}>
            <Text modifiers={[font({ size: 23, design: "serif", weight: "semibold" }), foregroundStyle(c.ink)]}>
              {p.petName}
            </Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(c.muted)]}>{p.petLine}</Text>
          </VStack>
        </HStack>
        <Text modifiers={[font({ size: 18, weight: "semibold" }), foregroundStyle(c.accent)]}>{p.focusLine}</Text>
        <Spacer />
        <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundStyle(c.muted)]}>TODAY'S VIBES</Text>
        {vibeRow(c.you, "You", p.youVibe)}
        {p.partnerName ? vibeRow(c.partner, p.partnerName, p.partnerVibe) : null}
        {p.memoryLine ? <Text modifiers={[font({ size: 13 }), foregroundStyle(c.muted)]}>{p.memoryLine}</Text> : null}
        <Text modifiers={[font({ size: 10 }), foregroundStyle(c.muted)]}>{p.freshnessLine}</Text>
      </VStack>
    );
  }

  if (!p.hasPet) {
    return (
      <VStack alignment="leading" spacing={env.widgetFamily === "systemMedium" ? 8 : 4} modifiers={base}>
        <Text modifiers={[font({ size: 19, design: "serif", weight: "semibold" }), foregroundStyle(c.ink)]}>
          Between
        </Text>
        {env.widgetFamily === "systemMedium" ? (
          <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundStyle(c.muted)]}>TODAY'S VIBES</Text>
        ) : null}
        {vibeRow(c.you, "You", p.youVibe)}
        {p.partnerName ? vibeRow(c.partner, p.partnerName, p.partnerVibe) : null}
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle(c.accent), minimumScaleFactor(0.75)]}>
          {p.focusLine}
        </Text>
      </VStack>
    );
  }

  if (env.widgetFamily === "systemMedium") {
    return (
      <HStack spacing={14} modifiers={base}>
        <VStack spacing={2}>
          {pet(86)}
          <Text modifiers={[font({ design: "serif", weight: "semibold", size: 15 }), foregroundStyle(c.ink)]}>
            {p.petName}
          </Text>
        </VStack>
        <VStack alignment="leading" spacing={7}>
          <Text modifiers={[font({ size: 11, weight: "bold", design: "rounded" }), foregroundStyle(c.muted)]}>
            TODAY
          </Text>
          {vibeRow(c.you, "You", p.youVibe)}
          {p.partnerName ? vibeRow(c.partner, p.partnerName, p.partnerVibe) : null}
          <Spacer />
          <Text
            modifiers={[
              font({ size: 14, weight: "semibold", design: "rounded" }),
              foregroundStyle(c.accent),
              minimumScaleFactor(0.8),
            ]}
          >
            {p.focusLine}
          </Text>
        </VStack>
      </HStack>
    );
  }

  // systemSmall
  return (
    <VStack alignment="leading" spacing={2} modifiers={base}>
      <HStack>
        {pet(64)}
        <Spacer />
      </HStack>
      <Spacer />
      <Text modifiers={[font({ design: "serif", weight: "semibold", size: 17 }), foregroundStyle(c.ink)]}>
        {p.petName}
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: "semibold", design: "rounded" }),
          foregroundStyle(c.accent),
          minimumScaleFactor(0.75),
        ]}
      >
        {p.focusLine}
      </Text>
      <Text modifiers={[font({ size: 11, design: "rounded" }), foregroundStyle(c.muted), padding({ top: 1 })]}>
        {p.petLine}
      </Text>
    </VStack>
  );
};

export default createWidget<UsWidgetProps>("Us", UsWidget);

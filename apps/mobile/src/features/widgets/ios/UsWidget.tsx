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
        <Text modifiers={[font({ design: "serif", weight: "semibold", size: 16 })]}>Love Notes</Text>
        <Text modifiers={[font({ size: 12 })]}>Open the app to wake your pet</Text>
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

  const pet = (size: number) => (
    <Image uiImage={p.petImage} modifiers={[resizable(), frame({ width: size, height: size })]} />
  );
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

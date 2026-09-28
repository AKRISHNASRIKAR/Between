import type { WidgetSnapshot } from "@lovenotes/contracts";
import { FlexWidget, ImageWidget, TextWidget } from "react-native-android-widget";
import { widgetType } from "@/design-system/tokens";
import { type PetArt, petArtFor, toUsWidgetProps } from "../props";

const ART: Record<PetArt, number> = {
  awake: require("../../../../assets/widget/pet-awake.png"),
  sleepy: require("../../../../assets/widget/pet-sleepy.png"),
  egg: require("../../../../assets/widget/pet-egg.png"),
};

type Hex = `#${string}`;

/**
 * Android "Us" widget (DESIGN §7.5), the same content as iOS. Compact (≈2×2): the pet and the
 * one thing worth tapping. Wide (≈4×2): plus both of today's vibes.
 */
export function UsWidget({ snapshot, width }: { snapshot: WidgetSnapshot | null; width: number }) {
  const p = toUsWidgetProps(snapshot, "");
  const c = p.colors as Record<keyof typeof p.colors, Hex>;
  const wide = width >= 250;
  const pet = (size: number) => <ImageWidget image={ART[petArtFor(snapshot)]} imageWidth={size} imageHeight={size} />;
  const vibeRow = (dot: Hex, who: string, vibe: string | null) => (
    <FlexWidget style={{ flexDirection: "row", alignItems: "center", width: "match_parent", marginTop: 6 }}>
      <TextWidget text="●" style={{ fontSize: widgetType.dot, color: dot, marginRight: 6 }} />
      <TextWidget text={who} style={{ fontSize: widgetType.body, color: c.ink, fontWeight: "500" }} />
      <FlexWidget style={{ flex: 1 }} />
      <TextWidget
        text={vibe ?? "not shared yet"}
        style={{ fontSize: widgetType.body, color: vibe ? c.ink : c.muted }}
      />
    </FlexWidget>
  );

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: p.url }}
      accessibilityLabel={`${p.petName}. ${p.focusLine}`}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: c.bg,
        borderRadius: 24,
        padding: 14,
        flexDirection: wide ? "row" : "column",
        alignItems: wide ? "center" : "flex-start",
      }}
    >
      {wide ? (
        <>
          <FlexWidget style={{ alignItems: "center", marginRight: 14 }}>
            {pet(84)}
            <TextWidget text={p.petName} style={{ fontSize: widgetType.name, fontWeight: "600", color: c.ink }} />
          </FlexWidget>
          <FlexWidget style={{ flex: 1, height: "match_parent" }}>
            <TextWidget
              text="TODAY"
              style={{ fontSize: widgetType.eyebrow, fontWeight: "700", color: c.muted, letterSpacing: 1 }}
            />
            {vibeRow(c.you, "You", p.youVibe)}
            {p.partnerName ? vibeRow(c.partner, p.partnerName, p.partnerVibe) : null}
            <FlexWidget style={{ flex: 1 }} />
            <TextWidget
              text={p.focusLine}
              maxLines={1}
              style={{ fontSize: widgetType.focus, fontWeight: "600", color: c.accent }}
            />
          </FlexWidget>
        </>
      ) : (
        <>
          {pet(60)}
          <FlexWidget style={{ flex: 1 }} />
          <TextWidget text={p.petName} style={{ fontSize: widgetType.title, fontWeight: "600", color: c.ink }} />
          <TextWidget
            text={p.focusLine}
            maxLines={2}
            style={{ fontSize: widgetType.body, fontWeight: "600", color: c.accent }}
          />
        </>
      )}
    </FlexWidget>
  );
}

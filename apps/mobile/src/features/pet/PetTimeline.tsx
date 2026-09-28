import { fillPetCopy, MILESTONE_COPY } from "@lovenotes/contracts";
import { View } from "react-native";
import { family, palette, radius, Skeleton, Sparkle, Text } from "@/design-system";
import { ago } from "@/lib/date";
import { usePetTimeline } from "./hooks";
import { type Entry, groupCare } from "./timeline";

const CARE_VERB = { feed: "fed", pet: "gave a scratch to", play: "played with" } as const;

const TIMES = ["", "", " · twice", " · three times"];

function Row({ entry, petName, who }: { entry: Entry; petName: string; who: (id: string | null) => string }) {
  const { item, times } = entry;
  const milestone = item.type === "milestone";
  const orange = family("orange");
  const copy = milestone ? MILESTONE_COPY[item.kind] : null;
  const text = copy
    ? fillPetCopy(copy.line, petName)
    : item.type === "care"
      ? `${who(item.byUserId)} ${CARE_VERB[item.kind]} ${petName}${TIMES[times] ?? ` · ${times} times`}`
      : "";
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {/* rail */}
      <View style={{ alignItems: "center", width: 24 }}>
        {milestone ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: radius.pill,
              backgroundColor: orange.base,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkle size={14} color={orange.onBase} weight="fill" />
          </View>
        ) : (
          <View
            style={{
              width: 8,
              height: 8,
              marginTop: 8,
              borderRadius: radius.pill,
              backgroundColor: palette["line-strong"],
            }}
          />
        )}
        <View style={{ flex: 1, width: 2, backgroundColor: palette.line }} />
      </View>
      <View style={{ flex: 1, gap: 2, paddingBottom: 16 }}>
        {copy ? <Text variant="heading">{copy.title}</Text> : null}
        <Text variant={milestone ? "body" : "body-sm"} color={milestone ? "ink" : "ink-secondary"}>
          {text}
        </Text>
        <Text variant="caption" color="ink-tertiary">
          {ago(item.at)}
        </Text>
      </View>
    </View>
  );
}

/** The Pet timeline (CONTEXT): Milestones, then the small everyday Care, newest first. */
export function PetTimeline({
  spaceId,
  petName,
  who,
}: {
  spaceId: string;
  petName: string;
  who: (userId: string | null) => string;
}) {
  const timeline = usePetTimeline(spaceId);
  if (timeline.isPending) return <Skeleton height={160} radius="lg" />;
  const items = timeline.data?.items ?? [];
  if (!items.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <Text variant="label" color="orange-deep">
        {petName}'s story
      </Text>
      <View>
        {groupCare(items).map((entry) => (
          <Row
            key={`${entry.item.type}-${entry.item.kind}-${entry.item.at}`}
            entry={entry}
            petName={petName}
            who={who}
          />
        ))}
      </View>
    </View>
  );
}

import { MOODS, type MoodCheckin } from "@lovenotes/contracts";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  ArrowLeft,
  ArrowRight,
  EmptyState,
  ErrorState,
  MoodCreature,
  PressableScale,
  palette,
  radius,
  Screen,
  Skeleton,
  Text,
} from "@/design-system";
import { partnerOf, useMe } from "@/features/space/hooks";
import { useVibeMonth } from "@/features/vibe/hooks";
import { monthLabel, monthString, shiftMonth } from "@/lib/date";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysOf(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y ?? 2000, (m ?? 1) - 1, 1);
  const count = new Date(y ?? 2000, m ?? 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  return { lead, count };
}

/** "Our vibes" — a month of moods as a visual memory, not a chart (SPEC §4.1). */
export default function Vibes() {
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const [month, setMonth] = useState(monthString());
  const data = useVibeMonth(space?.id, month);
  const isCurrent = month === monthString();

  const byDay = (list: MoodCheckin[] | undefined) =>
    new Map((list ?? []).map((c) => [Number(c.localDate.slice(8, 10)), c]));
  const mine = byDay(data.data?.mine);
  const theirs = byDay(data.data?.partner);
  const { lead, count } = daysOf(month);
  const empty = data.data && data.data.mine.length === 0 && data.data.partner.length === 0;

  return (
    <Screen>
      <View style={{ gap: 24, paddingTop: 8 }}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <Text variant="label" color="sky-deep">
            Our vibes
          </Text>
          <View className="flex-row items-center justify-between">
            <Text variant="display-l">{monthLabel(month)}</Text>
          </View>
          <View className="flex-row gap-3 pt-2">
            <PressableScale
              accessibilityLabel="Previous month"
              onPress={() => setMonth(shiftMonth(month, -1))}
              hitSlop={8}
            >
              <ArrowLeft size={22} color={palette.ink} weight="bold" />
            </PressableScale>
            <PressableScale
              accessibilityLabel="Next month"
              disabled={isCurrent}
              onPress={() => setMonth(shiftMonth(month, 1))}
              hitSlop={8}
            >
              <ArrowRight size={22} color={palette.ink} weight="bold" />
            </PressableScale>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-2">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette["teal-base"] }} />
            <Text variant="caption" color="ink-secondary">
              You
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette["tomato-base"] }} />
            <Text variant="caption" color="ink-secondary">
              {partner?.displayName ?? "Them"} (shared only)
            </Text>
          </View>
        </View>

        {data.isPending ? (
          <Skeleton height={320} radius="lg" />
        ) : data.isError ? (
          <ErrorState onRetry={() => data.refetch()} retrying={data.isFetching} />
        ) : (
          <View style={{ backgroundColor: palette.paper, borderRadius: radius.lg, padding: 12 }}>
            <View className="flex-row">
              {WEEKDAYS.map((d) => (
                <View key={d} style={{ width: `${100 / 7}%`, alignItems: "center", paddingBottom: 6 }}>
                  <Text variant="label-sm" color="ink-tertiary" accessibilityLabel={d}>
                    {d[0]}
                  </Text>
                </View>
              ))}
            </View>
            <View className="flex-row flex-wrap">
              {Array.from({ length: lead }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: blank positional cells before day 1
                <View key={`lead-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 0.8 }} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const day = i + 1;
                const a = mine.get(day);
                const b = theirs.get(day);
                const label = [a && `you ${MOODS[a.mood].label}`, b && `${partner?.displayName} ${MOODS[b.mood].label}`]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <View
                    key={day}
                    accessible
                    accessibilityLabel={`Day ${day}${label ? `: ${label}` : ""}`}
                    style={{ width: `${100 / 7}%`, aspectRatio: 0.8, alignItems: "center", paddingTop: 2 }}
                  >
                    <Text variant="caption" color="ink-tertiary">
                      {day}
                    </Text>
                    <View style={{ flexDirection: "row", marginTop: 2 }}>
                      {a ? <MoodCreature mood={a.mood} size={20} backdrop={palette.paper} /> : null}
                      {b ? (
                        <View style={{ marginLeft: a ? -6 : 0 }}>
                          <MoodCreature mood={b.mood} size={20} backdrop={palette.paper} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {empty ? (
          <EmptyState
            illustration={<MoodCreature mood="calm" size={96} />}
            title="A quiet month"
            body="Check in on Today and your vibes will gather here, day by day."
          />
        ) : null}
      </View>
    </Screen>
  );
}

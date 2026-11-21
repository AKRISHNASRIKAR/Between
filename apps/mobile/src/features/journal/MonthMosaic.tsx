import type { JournalPage } from "@lovenotes/contracts";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  CaretLeft,
  CaretRight,
  Dots,
  identity,
  layout,
  lift,
  PressableScale,
  palette,
  radius,
  space,
  Text,
  useThemeSubscription,
} from "@/design-system";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const GAP = space[1];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const todayIso = () => {
  const n = new Date();
  return iso(n.getFullYear(), n.getMonth(), n.getDate());
};

/**
 * Memories · Month mosaic (design decision 2026-11-21): a calendar where every day with a page
 * shows its first photo. Today is a dashed invitation. Tap a day for a preview of that page.
 * Pages arrive newest first, so stepping back a month fetches older pages until it is covered.
 */
export function MonthMosaic({
  pages,
  myId,
  width,
  hasMore,
  loadingMore,
  loadMore,
}: {
  pages: JournalPage[];
  myId: string | undefined;
  width: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
}) {
  useThemeSubscription();
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const byDate = useMemo(() => new Map(pages.map((p) => [p.pageDate, p])), [pages]);
  const monthStart = iso(month.y, month.m, 1);
  const oldestLoaded = pages.at(-1)?.pageDate;
  const needsOlder = hasMore && (!oldestLoaded || oldestLoaded >= monthStart);

  useEffect(() => {
    if (needsOlder && !loadingMore) loadMore();
  }, [needsOlder, loadingMore, loadMore]);

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const leading = (new Date(month.y, month.m, 1).getDay() + 6) % 7; // Monday first
  const cell = Math.floor((width - GAP * 6) / 7);
  const today = todayIso();
  const monthPages = pages.filter((p) => p.pageDate.startsWith(monthStart.slice(0, 7)));
  const [picked, setPicked] = useState<string | null>(null);
  const selected = (picked && byDate.get(picked)) || monthPages[0];
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();
  const step = (delta: number) => {
    setPicked(null);
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const title = new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const arrow = (dir: -1 | 1) => {
    const disabled = dir === 1 && isCurrentMonth;
    const Icon = dir === -1 ? CaretLeft : CaretRight;
    return (
      <PressableScale
        disabled={disabled}
        onPress={() => step(dir)}
        accessibilityRole="button"
        accessibilityLabel={dir === -1 ? "Previous month" : "Next month"}
        accessibilityState={{ disabled }}
        style={{
          width: layout.minTouch,
          height: layout.minTouch,
          borderRadius: radius.pill,
          backgroundColor: palette.sunken,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Icon size={18} color={palette.ink} weight="bold" />
      </PressableScale>
    );
  };

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {arrow(-1)}
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {arrow(1)}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`wd-${String(i)}`} variant="caption" color="ink-tertiary" align="center" style={{ width: cell }}>
            {d}
          </Text>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <View key={`pad-${String(i)}`} style={{ width: cell, height: cell }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = iso(month.y, month.m, day);
          const page = byDate.get(date);
          const thumb = page?.blocks.flatMap((b) => b.media)[0];
          const isToday = date === today;
          const isSelected = !!page && page.id === selected?.id;
          const future = date > today;
          const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" });
          return (
            <PressableScale
              key={date}
              disabled={future || (!page && !isToday)}
              onPress={() => (page ? setPicked(date) : router.push("/journal/new"))}
              accessibilityRole="button"
              accessibilityLabel={
                page ? `${label}: ${page.title ?? "a page"}` : isToday ? `Today, ${label}: write today's page` : label
              }
              accessibilityState={{ selected: isSelected }}
              style={{
                width: cell,
                height: cell,
                borderRadius: radius.sm,
                overflow: "hidden",
                backgroundColor: page ? palette["butter-soft"] : palette.sunken,
                borderWidth: isToday && !page ? 1.5 : isSelected ? 2 : 0,
                borderStyle: isToday && !page ? "dashed" : "solid",
                borderColor: palette.action,
                opacity: future ? 0.5 : 1,
              }}
            >
              {thumb ? (
                <Image
                  source={{ uri: thumb.thumbUrl, cacheKey: `${thumb.id}-t` }}
                  recyclingKey={thumb.id}
                  style={{ position: "absolute", inset: 0 }}
                  contentFit="cover"
                />
              ) : null}
              <View
                style={{
                  margin: space[1],
                  alignSelf: "flex-start",
                  paddingHorizontal: thumb ? space[1] : 0,
                  borderRadius: radius.sm,
                  backgroundColor: thumb ? palette.paper : "transparent",
                }}
              >
                <Text variant="caption" color={page ? "ink" : "ink-tertiary"}>
                  {day}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {needsOlder || loadingMore ? (
        <View style={{ alignItems: "center" }} accessibilityLabel="Loading older pages">
          <Dots />
        </View>
      ) : selected ? (
        <PressableScale
          onPress={() => router.push(`/journal/${selected.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${selected.title ?? "this page"}`}
          style={[
            {
              backgroundColor: palette.paper,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: space[4],
              gap: space[2],
            },
            lift[1],
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
            <View style={{ flex: 1, gap: space[1] }}>
              <Text variant="label" color="ink-tertiary">
                {new Date(`${selected.pageDate}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </Text>
              <Text variant="heading" numberOfLines={1}>
                {selected.title ?? "A page from that day"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: space[1] }}>
              {[...new Set(selected.blocks.map((b) => b.authorId))].map((a) => (
                <View
                  key={a}
                  accessibilityLabel={a === myId ? "You wrote here" : "Your partner wrote here"}
                  style={{
                    width: space[2],
                    height: space[2],
                    borderRadius: radius.pill,
                    backgroundColor: a === myId ? identity.you : identity.partner,
                  }}
                />
              ))}
            </View>
          </View>
          {selected.blocks.find((b) => b.body)?.body ? (
            <Text variant="body-sm" color="ink-secondary" numberOfLines={2}>
              {selected.blocks.find((b) => b.body)?.body}
            </Text>
          ) : null}
        </PressableScale>
      ) : (
        <Text variant="body-sm" color="ink-secondary" align="center">
          {isCurrentMonth ? "No pages this month yet. Today's square is waiting." : "No pages this month."}
        </Text>
      )}
    </View>
  );
}

import type { JournalPage, Media } from "@lovenotes/contracts";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dots,
  EmptyState,
  ErrorState,
  enter,
  identity,
  layout,
  MoodCreature,
  Pencil,
  PressableScale,
  palette,
  radius,
  Segmented,
  Skeleton,
  TabHeader,
  Text,
} from "@/design-system";
import { useMemories, usePages } from "@/features/journal/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";

type Tab = "pages" | "photos";
const longDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" });
const monthOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

function PageCard({ page, myId, width }: { page: JournalPage; myId: string | undefined; width: number }) {
  const text = page.blocks.find((b) => b.body)?.body;
  const photos = page.blocks.flatMap((b) => b.media).slice(0, 4);
  const authors = [...new Set(page.blocks.map((b) => b.authorId))];
  return (
    <PressableScale
      accessibilityLabel={`${longDate(page.pageDate)}${page.title ? `, ${page.title}` : ""}`}
      onPress={() => router.push(`/journal/${page.id}`)}
      style={{ backgroundColor: palette.paper, borderRadius: radius.paper, padding: 18, gap: 10 }}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="label" color="butter-deep">
          {longDate(page.pageDate)}
        </Text>
        <View className="flex-row gap-1">
          {authors.map((a) => (
            <View
              key={a}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: a === myId ? identity.you : identity.partner,
              }}
            />
          ))}
        </View>
      </View>
      {page.title ? <Text variant="display-m">{page.title}</Text> : null}
      {text ? (
        <Text variant="body" color="ink-secondary" numberOfLines={3}>
          {text}
        </Text>
      ) : null}
      {photos.length ? (
        <View className="flex-row gap-1">
          {photos.map((m) => (
            <Image
              key={m.id}
              source={{ uri: m.thumbUrl, cacheKey: `${m.id}-t` }}
              style={{ width: (width - 36 - 12) / 4, aspectRatio: 1, borderRadius: 3, backgroundColor: palette.sunken }}
              contentFit="cover"
            />
          ))}
        </View>
      ) : null}
      {page.lovedBy.length ? (
        <Text variant="caption" color="pink-deep">
          ♥︎ {page.lovedBy.length === 2 ? "loved by you both" : "loved"}
        </Text>
      ) : null}
    </PressableScale>
  );
}

/** REMEMBER (SPEC §4.4): the shared journal and its photos — one data model, two views. */
export default function Remember() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const [tab, setTab] = useState<Tab>("pages");
  const pages = usePages(space?.id);
  const memories = useMemories(space?.id);
  const contentW = Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2;
  const cell = (contentW - layout.photoGridGap * 2) / 3;

  const header = (
    <View style={{ gap: 16, paddingTop: insets.top + 16, paddingBottom: 16 }}>
      <TabHeader
        title="Our journal"
        action={{
          label: "Write about today",
          icon: Pencil,
          family: "butter",
          onPress: () => router.push("/journal/new"),
        }}
      />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "pages", label: "Pages" },
          { value: "photos", label: "Photos" },
        ]}
      />
    </View>
  );

  if (tab === "pages") {
    const items = pages.data?.pages.flatMap((p) => p.items) ?? [];
    return (
      <FlatList
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 32 }}
        data={items}
        keyExtractor={(p) => p.id}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={pages.isRefetching} onRefresh={() => pages.refetch()} />}
        onEndReached={() => pages.hasNextPage && !pages.isFetchingNextPage && pages.fetchNextPage()}
        ListFooterComponent={pages.isFetchingNextPage ? <Dots /> : null}
        ListEmptyComponent={
          pages.isPending ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={140} radius="paper" />
              <Skeleton height={140} radius="paper" />
            </View>
          ) : pages.isError ? (
            <ErrorState onRetry={() => pages.refetch()} />
          ) : (
            <EmptyState
              illustration={<MoodCreature mood="joyful" size={96} />}
              title="A blank notebook"
              body={`Write about today — ${partner?.displayName ?? "they"} can add their side on the same page.`}
            />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 6 ? enter(index) : undefined}>
            <PageCard page={item} myId={me.data?.profile.id} width={contentW} />
          </Animated.View>
        )}
      />
    );
  }

  const photos = memories.data?.pages.flatMap((p) => p.items) ?? [];
  // Month headers interleaved as full-width rows.
  type Row = { kind: "month"; label: string } | { kind: "row"; items: Media[] };
  const rows: Row[] = [];
  let month = "";
  let current: Media[] = [];
  const flush = () => {
    for (let i = 0; i < current.length; i += 3) rows.push({ kind: "row", items: current.slice(i, i + 3) });
    current = [];
  };
  for (const m of photos) {
    const label = monthOf(m.createdAt);
    if (label !== month) {
      flush();
      rows.push({ kind: "month", label });
      month = label;
    }
    current.push(m);
  }
  flush();

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.canvas }}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 32 }}
      data={rows}
      keyExtractor={(r, i) => (r.kind === "month" ? `m-${r.label}` : `r-${r.items[0]?.id ?? i}`)}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={memories.isRefetching} onRefresh={() => memories.refetch()} />}
      onEndReached={() => memories.hasNextPage && !memories.isFetchingNextPage && memories.fetchNextPage()}
      ListEmptyComponent={
        memories.isPending ? (
          <Skeleton height={cell} radius="sm" />
        ) : memories.isError ? (
          <ErrorState onRetry={() => memories.refetch()} />
        ) : (
          <EmptyState
            illustration={<MoodCreature mood="calm" size={96} />}
            title="No memories yet"
            body="Start saving little moments together — add photos to a journal page."
          />
        )
      }
      renderItem={({ item }) =>
        item.kind === "month" ? (
          <Text variant="label" color="ink-tertiary" style={{ paddingTop: 12, paddingBottom: 8 }}>
            {item.label}
          </Text>
        ) : (
          <View style={{ flexDirection: "row", gap: layout.photoGridGap, marginBottom: layout.photoGridGap }}>
            {item.items.map((m) => (
              <PressableScale
                key={m.id}
                accessibilityLabel={m.caption ?? "Photo"}
                onPress={() => m.pageId && router.push(`/journal/${m.pageId}`)}
              >
                <Image
                  source={{ uri: m.thumbUrl, cacheKey: `${m.id}-t` }}
                  style={{ width: cell, height: cell, backgroundColor: palette.sunken }}
                  contentFit="cover"
                />
              </PressableScale>
            ))}
          </View>
        )
      }
    />
  );
}

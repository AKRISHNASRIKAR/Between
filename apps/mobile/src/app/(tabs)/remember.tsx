import type { JournalPage } from "@lovenotes/contracts";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useMemo, useState } from "react";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dots,
  EmptyState,
  ErrorState,
  ImageSquare,
  identity,
  illustrations,
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
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useMemories, usePages } from "@/features/journal/hooks";
import { MemoryGallery } from "@/features/journal/MemoryGallery";
import { partnerOf, useMe } from "@/features/space/hooks";

type Tab = "pages" | "photos";
const longDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" });

const PageCard = memo(function PageCard({
  page,
  myId,
  width,
}: {
  page: JournalPage;
  myId: string | undefined;
  width: number;
}) {
  useThemeSubscription();
  const text = page.blocks.find((b) => b.body)?.body;
  const photos = page.blocks.flatMap((b) => b.media).slice(0, 4);
  const authors = [...new Set(page.blocks.map((b) => b.authorId))];
  return (
    <PressableScale
      accessibilityLabel={`${longDate(page.pageDate)}${page.title ? `, ${page.title}` : ""}`}
      onPress={() => router.push(`/journal/${page.id}`)}
      style={{
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        padding: 20,
        gap: 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="label" color="action">
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
              recyclingKey={m.id}
              style={{ width: (width - 40 - 12) / 4, aspectRatio: 1, borderRadius: 3, backgroundColor: palette.sunken }}
              contentFit="cover"
            />
          ))}
        </View>
      ) : null}
      {page.lovedBy.length ? (
        <Text variant="caption" color="action">
          ♥︎ {page.lovedBy.length === 2 ? "loved by you both" : "loved"}
        </Text>
      ) : null}
    </PressableScale>
  );
});

/** REMEMBER (SPEC §4.4): the shared journal and its photos — one data model, two views. */
export default function Remember() {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const [tab, setTab] = useState<Tab>("pages");
  const pages = usePages(space?.id, tab === "pages");
  const memories = useMemories(space?.id, tab === "photos");
  const contentW = Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2;
  const horizontalPadding = Math.max(layout.gutter, (width - layout.maxContentWidth) / 2);
  const items = useMemo(() => pages.data?.pages.flatMap((p) => p.items) ?? [], [pages.data]);
  const photos = useMemo(() => {
    const unique = new Map((memories.data?.pages.flatMap((p) => p.items) ?? []).map((photo) => [photo.id, photo]));
    return [...unique.values()];
  }, [memories.data]);
  const cell = (contentW - 8) / 2;

  const header = (
    <View style={{ gap: 16, paddingTop: insets.top + 16, paddingBottom: 16 }}>
      <TabHeader
        title="Memories"
        subtitle="Your days, in words and photos."
        action={{
          label: "Keep a memory",
          icon: tab === "photos" ? ImageSquare : Pencil,
          family: "butter",
          onPress: () => router.push("/journal/new"),
        }}
      />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "pages", label: "Journal" },
          { value: "photos", label: "Photos" },
        ]}
      />
    </View>
  );

  if (tab === "pages") {
    return (
      <FlatList
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}
        data={items}
        keyExtractor={(p) => p.id}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={pages.isRefetching}
            onRefresh={() => pages.refetch()}
            tintColor={palette.action}
          />
        }
        onEndReached={() => pages.hasNextPage && !pages.isFetchingNextPage && pages.fetchNextPage()}
        ListFooterComponent={pages.isFetchingNextPage ? <Dots /> : null}
        ListEmptyComponent={
          pages.isPending ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={140} radius="lg" />
              <Skeleton height={140} radius="lg" />
            </View>
          ) : pages.isError ? (
            <ErrorState onRetry={() => pages.refetch()} />
          ) : (
            <EmptyState
              illustration={<MoodCreature mood={illustrations.empty.journal} size={96} />}
              title="Your story starts here"
              action={{ label: "Keep a memory", onPress: () => router.push("/journal/new") }}
              body={`Write about today — ${partner?.displayName ?? "they"} can add their side on the same page.`}
            />
          )
        }
        renderItem={({ item }) => (
          <View>
            <PageCard page={item} myId={me.data?.profile.id} width={contentW} />
          </View>
        )}
      />
    );
  }

  return (
    <MemoryGallery
      photos={photos}
      header={header}
      horizontalPadding={horizontalPadding}
      refreshing={memories.isRefetching && !memories.isFetchingNextPage}
      loadingMore={memories.isFetchingNextPage}
      moreError={memories.isFetchNextPageError}
      hasMore={!!memories.hasNextPage}
      refresh={() => {
        void memories.refetch();
      }}
      loadMore={() => {
        void memories.fetchNextPage();
      }}
      empty={
        memories.isPending ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Skeleton height={cell * 1.35} width={cell} radius="lg" />
            <Skeleton height={cell} width={cell} radius="lg" />
          </View>
        ) : memories.isError ? (
          <ErrorState onRetry={() => memories.refetch()} />
        ) : (
          <EmptyState
            illustration={<MoodCreature mood={illustrations.empty.memories} size={96} />}
            title="Your moments, kept together"
            action={{ label: "Keep a memory", onPress: () => router.push("/journal/new") }}
            body="Start saving little moments together — add photos to a journal page."
          />
        )
      }
    />
  );
}

import { router } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EmptyState,
  ErrorState,
  ImageSquare,
  illustrations,
  layout,
  MoodCreature,
  Pencil,
  palette,
  Segmented,
  Skeleton,
  TabHeader,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useMemories, usePages } from "@/features/journal/hooks";
import { MemoryGallery } from "@/features/journal/MemoryGallery";
import { MonthMosaic } from "@/features/journal/MonthMosaic";
import { partnerOf, useMe } from "@/features/space/hooks";

type Tab = "pages" | "photos";

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
          { value: "pages", label: "Calendar" },
          { value: "photos", label: "Photos" },
        ]}
      />
    </View>
  );

  if (tab === "pages") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={pages.isRefetching && !pages.isFetchingNextPage}
            onRefresh={() => pages.refetch()}
            tintColor={palette.action}
          />
        }
      >
        {header}
        {pages.isPending ? (
          <View style={{ gap: 14 }}>
            <Skeleton height={contentW} radius="lg" />
            <Skeleton height={96} radius="lg" />
          </View>
        ) : pages.isError ? (
          <ErrorState onRetry={() => pages.refetch()} />
        ) : items.length === 0 && !pages.hasNextPage ? (
          <EmptyState
            illustration={<MoodCreature mood={illustrations.empty.journal} size={96} />}
            title="Your story starts here"
            action={{ label: "Keep a memory", onPress: () => router.push("/journal/new") }}
            body={`Write about today — ${partner?.displayName ?? "they"} can add their side on the same page.`}
          />
        ) : (
          <MonthMosaic
            pages={items}
            myId={me.data?.profile.id}
            width={contentW}
            hasMore={!!pages.hasNextPage}
            loadingMore={pages.isFetchingNextPage}
            loadMore={() => {
              void pages.fetchNextPage();
            }}
          />
        )}
      </ScrollView>
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

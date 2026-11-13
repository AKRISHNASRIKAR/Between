import type { NoteBox } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Chip,
  Dots,
  EmptyState,
  EnvelopeBody,
  EnvelopeFlap,
  ErrorState,
  layout,
  NoteCard,
  PaperPlaneTilt,
  PressableScale,
  palette,
  Skeleton,
  TabHeader,
  Text,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useNotes } from "@/features/notes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";

const FILTERS: Array<{ box: NoteBox; label: string }> = [
  { box: "all", label: "All" },
  { box: "inbox", label: "For me" },
  { box: "sent", label: "From me" },
];

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** The note wall (SPEC §4.3): sealed envelopes for unopened notes to you, paper for the rest. */
export default function Notes() {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const horizontalPadding = Math.max(layout.gutter, (width - layout.maxContentWidth) / 2);
  const columns = width < 360 || fontScale > 1.2 ? 1 : 2;
  const contentWidth = Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2;
  const itemWidth = (contentWidth - (columns - 1) * 12) / columns;
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const [box, setBox] = useState<NoteBox>("all");
  const notes = useNotes(space?.id, box);
  const items = notes.data?.pages.flatMap((p) => p.items) ?? [];

  const header = (
    <View style={{ gap: 16, paddingTop: insets.top + 16, paddingBottom: 16 }}>
      <TabHeader
        title="Notes"
        subtitle={`A little something for ${partner?.displayName ?? "your person"}.`}
        action={{
          label: "Leave a note",
          icon: PaperPlaneTilt,
          family: "pink",
          onPress: () => router.push("/notes/new"),
        }}
      />
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.box} label={f.label} family="pink" selected={box === f.box} onPress={() => setBox(f.box)} />
        ))}
      </View>
    </View>
  );

  if (notes.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas, paddingHorizontal: horizontalPadding }}>
        {header}
        <View className="flex-row gap-3">
          <View style={{ flex: 1 }}>
            <Skeleton height={160} radius="paper" />
          </View>
          <View style={{ flex: 1 }}>
            <Skeleton height={160} radius="paper" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.canvas }}
      contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}
      data={items}
      keyExtractor={(n) => n.id}
      key={columns}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl refreshing={notes.isRefetching} onRefresh={() => notes.refetch()} tintColor={palette.action} />
      }
      onEndReached={() => notes.hasNextPage && !notes.isFetchingNextPage && notes.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        notes.isFetchingNextPage ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <Dots />
          </View>
        ) : null
      }
      ListEmptyComponent={
        notes.isError ? (
          <ErrorState onRetry={() => notes.refetch()} retrying={notes.isFetching} />
        ) : (
          <EmptyState
            illustration={<EnvelopeBody paper="blush" width={140} />}
            title={
              box === "inbox" ? "Nothing waiting yet" : box === "sent" ? "You haven't left one yet" : "No notes yet"
            }
            action={{ label: "Leave a note", onPress: () => router.push("/notes/new") }}
            body={
              box === "inbox"
                ? `When ${partner?.displayName ?? "your person"} leaves you something, it'll land here.`
                : `Leave ${partner?.displayName ?? "them"} a little something — it’ll be waiting for them.`
            }
          />
        )
      }
      renderItem={({ item }) => {
        const mine = item.authorId === myId;
        const sealed = !mine && !item.openedAt;
        const who = mine ? `To ${partner?.displayName ?? "them"}` : `From ${partner?.displayName ?? "them"}`;
        return (
          <View style={{ width: itemWidth }}>
            <PressableScale
              accessibilityLabel={
                sealed ? `Sealed note from ${partner?.displayName}. Open it.` : `${who}: ${item.body}`
              }
              onPress={() => router.push(`/notes/${item.id}`)}
            >
              {sealed ? (
                <View style={{ paddingTop: 10 }}>
                  <View>
                    <EnvelopeBody paper={item.paper} width={itemWidth} />
                    <View style={{ position: "absolute", top: 0 }}>
                      <EnvelopeFlap paper={item.paper} width={itemWidth} />
                    </View>
                  </View>
                  <Text variant="caption" color="action" style={{ marginTop: 6 }}>
                    New · {who}
                  </Text>
                </View>
              ) : (
                <NoteCard
                  id={item.id}
                  body={item.body}
                  paper={item.paper}
                  footer={
                    <View className="flex-row items-center justify-between">
                      <Text variant="caption" color="ink-secondary" style={{ flex: 1 }}>
                        {who} · {shortDate(item.createdAt)}
                      </Text>
                      {item.reactedAt ? (
                        <Text variant="caption" color="action" accessibilityLabel="Loved">
                          ♥︎
                        </Text>
                      ) : null}
                    </View>
                  }
                />
              )}
            </PressableScale>
          </View>
        );
      }}
    />
  );
}

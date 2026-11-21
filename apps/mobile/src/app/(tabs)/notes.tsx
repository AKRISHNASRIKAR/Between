import type { Note } from "@lovenotes/contracts";
import { router } from "expo-router";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dots,
  EmptyState,
  EnvelopeBody,
  EnvelopeFlap,
  ErrorState,
  layout,
  lift,
  NoteCard,
  PaperPlaneTilt,
  PressableScale,
  palette,
  radius,
  Skeleton,
  space,
  TabHeader,
  Text,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useNotes } from "@/features/notes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const dayKey = (iso: string) => new Date(iso).toDateString();
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

/**
 * Notes · Correspondence (design decision 2026-11-21): one thread of paper notes, theirs on
 * the left and yours on the right, newest at the bottom, with a docked compose bar.
 */
export default function Notes() {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(layout.gutter, (width - layout.maxContentWidth) / 2);
  const contentWidth = Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2;
  const bubbleWidth = Math.round(contentWidth * 0.78);
  const me = useMe();
  const space_ = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space_, myId);
  const partnerName = partner?.displayName ?? "your person";
  const notes = useNotes(space_?.id, "all");
  // Newest first from the API; the list is inverted so the newest sits at the bottom, like a letter thread.
  const items = notes.data?.pages.flatMap((p) => p.items) ?? [];
  const compose = () => router.push("/notes/new");

  const header = (
    <View style={{ paddingTop: insets.top + space[4], paddingBottom: space[3], paddingHorizontal: horizontalPadding }}>
      <TabHeader title="Notes" subtitle={`Between you and ${partnerName}.`} />
    </View>
  );

  const dock = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space[2],
        paddingHorizontal: horizontalPadding,
        paddingTop: space[2],
        paddingBottom: space[3],
        backgroundColor: palette.canvas,
      }}
    >
      <PressableScale
        onPress={compose}
        accessibilityRole="button"
        accessibilityLabel={`Write a note to ${partnerName}`}
        style={[
          {
            flex: 1,
            height: layout.minTouch + space[1],
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: palette.line,
            backgroundColor: palette.paper,
            justifyContent: "center",
            paddingHorizontal: space[4],
          },
          lift[1],
        ]}
      >
        <Text variant="body" color="ink-tertiary" numberOfLines={1}>
          Write to {partnerName}…
        </Text>
      </PressableScale>
      <PressableScale
        onPress={compose}
        accessibilityRole="button"
        accessibilityLabel="Leave a note"
        style={{
          width: layout.minTouch + space[1],
          height: layout.minTouch + space[1],
          borderRadius: radius.pill,
          backgroundColor: palette.action,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PaperPlaneTilt size={22} color={palette["on-action"]} weight="fill" />
      </PressableScale>
    </View>
  );

  if (notes.isPending)
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas }}>
        {header}
        <View style={{ flex: 1, paddingHorizontal: horizontalPadding, gap: space[4], justifyContent: "flex-end" }}>
          <View style={{ width: bubbleWidth }}>
            <Skeleton height={space[20]} radius="paper" />
          </View>
          <View style={{ width: bubbleWidth, alignSelf: "flex-end" }}>
            <Skeleton height={space[20]} radius="paper" />
          </View>
        </View>
        {dock}
      </View>
    );

  if (items.length === 0)
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas }}>
        {header}
        <View style={{ flex: 1, paddingHorizontal: horizontalPadding, justifyContent: "center" }}>
          {notes.isError ? (
            <ErrorState onRetry={() => notes.refetch()} retrying={notes.isFetching} />
          ) : (
            <EmptyState
              illustration={<EnvelopeBody paper="blush" width={140} />}
              title="No notes yet"
              body={`The first one doesn't need to be big. "Thinking of you" is plenty for ${partnerName}.`}
            />
          )}
        </View>
        {dock}
      </View>
    );

  const renderNote = ({ item, index }: { item: Note; index: number }) => {
    const mine = item.authorId === myId;
    const sealed = !mine && !item.openedAt;
    const older = items[index + 1];
    const startsDay = !older || dayKey(older.createdAt) !== dayKey(item.createdAt);
    const meta = mine
      ? `You · ${time(item.createdAt)}${item.openedAt ? " · opened" : ""}${item.reactedAt ? " · ♥︎" : ""}`
      : `${partnerName} · ${time(item.createdAt)}${item.reactedAt ? " · ♥︎" : ""}`;
    return (
      <View style={{ gap: space[3] }}>
        {startsDay ? (
          <Text variant="caption" color="ink-tertiary" align="center" style={{ paddingTop: space[2] }}>
            {dayLabel(item.createdAt)}
          </Text>
        ) : null}
        <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
          <PressableScale
            onPress={() => router.push(`/notes/${item.id}`)}
            accessibilityLabel={
              sealed ? `Sealed note from ${partnerName}. Open it.` : `${mine ? "You" : partnerName}: ${item.body}`
            }
            style={{ width: sealed ? Math.round(contentWidth * 0.62) : bubbleWidth }}
          >
            {sealed ? (
              <View style={{ gap: space[2], transform: [{ rotate: "-2deg" }] }}>
                <View>
                  <EnvelopeBody paper={item.paper} width={Math.round(contentWidth * 0.62)} />
                  <View style={{ position: "absolute", top: 0 }}>
                    <EnvelopeFlap paper={item.paper} width={Math.round(contentWidth * 0.62)} />
                  </View>
                </View>
                <Text variant="caption" color="action">
                  Sealed · from {partnerName} · tap to open
                </Text>
              </View>
            ) : (
              <NoteCard
                id={item.id}
                body={item.body}
                paper={item.paper}
                footer={
                  <Text variant="caption" color="ink-secondary" align={mine ? "right" : "left"}>
                    {meta}
                  </Text>
                }
              />
            )}
          </PressableScale>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      {header}
      <FlatList
        inverted
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingVertical: space[3] }}
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={renderNote}
        ItemSeparatorComponent={() => <View style={{ height: space[4] }} />}
        refreshControl={
          <RefreshControl
            refreshing={notes.isRefetching}
            onRefresh={() => notes.refetch()}
            tintColor={palette.action}
          />
        }
        onEndReached={() => notes.hasNextPage && !notes.isFetchingNextPage && notes.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          notes.isFetchingNextPage ? (
            <View style={{ paddingVertical: space[4], alignItems: "center" }}>
              <Dots />
            </View>
          ) : notes.hasNextPage ? null : (
            <Text variant="caption" color="ink-tertiary" align="center" style={{ paddingVertical: space[4] }}>
              The beginning of your notes
            </Text>
          )
        }
      />
      {dock}
    </View>
  );
}

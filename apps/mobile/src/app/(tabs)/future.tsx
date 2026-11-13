import { FUTURE_CATEGORY_LABEL, type FutureCategory, type FutureItem } from "@lovenotes/contracts";
import { memo, useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, SectionList, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Check,
  Chip,
  Confetti,
  EmptyState,
  ErrorState,
  FutureTicket,
  haptics,
  illustrations,
  layout,
  MoodCreature,
  Plus,
  PressableScale,
  palette,
  Sheet,
  Skeleton,
  stroke,
  TabHeader,
  Text,
  TextField,
  useToast,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useAddFuture, useDeleteFuture, useFuture, useToggleFuture } from "@/features/future/hooks";
import { useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

const CATS: FutureCategory[] = ["dream", "place", "watch", "try", "goal"];
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase();

function CheckCircle({ done }: { done: boolean }) {
  useThemeSubscription();
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: stroke.regular,
        borderColor: done ? palette.action : palette["line-strong"],
        backgroundColor: done ? palette.action : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {done ? <Check size={16} color={palette["on-action"]} weight="bold" /> : null}
    </View>
  );
}

const FutureRow = memo(function FutureRow({
  f,
  pending,
  onToggle,
  onLongPress,
}: {
  f: FutureItem;
  pending: boolean;
  onToggle: (f: FutureItem) => void;
  onLongPress: (f: FutureItem) => void;
}) {
  useThemeSubscription();
  return (
    <PressableScale
      disabled={pending || f.id.startsWith("optimistic-")}
      accessibilityLabel={`${f.title}${f.completedAt ? ", done" : ""}`}
      accessibilityHint={f.completedAt ? "Tap to mark as not done" : "Tap to mark as done. Long-press to remove."}
      onPress={() => onToggle(f)}
      onLongPress={() => onLongPress(f)}
    >
      <FutureTicket
        title={f.title}
        emoji={f.emoji}
        category={FUTURE_CATEGORY_LABEL[f.category]}
        doneOn={f.completedAt ? shortDate(f.completedAt) : null}
        right={<CheckCircle done={!!f.completedAt} />}
      />
    </PressableScale>
  );
});

/** BUILD (SPEC §4.5): tickets for what's next; stamp them when you do them. */
export default function Future() {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const list = useFuture(space?.id);
  const add = useAddFuture(space?.id, me.data?.profile.id);
  const toggle = useToggleFuture(space?.id);
  const del = useDeleteFuture(space?.id);
  const toast = useToast();
  const { mutate: toggleItem, isPending: toggling } = toggle;
  const { mutate: deleteItem, isPending: deleting } = del;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FutureCategory>("dream");
  const [filter, setFilter] = useState<FutureCategory | "all">("all");
  const [burst, setBurst] = useState(0);

  const sections = useMemo(() => {
    const items = (list.data ?? []).filter((f) => filter === "all" || f.category === filter);
    const upcoming = items.filter((f) => !f.completedAt);
    const done = items.filter((f) => f.completedAt);
    return [
      ...(upcoming.length ? [{ key: "upcoming", title: null, data: upcoming }] : []),
      ...(done.length ? [{ key: "done", title: `Made it happen · ${done.length}`, data: done }] : []),
    ];
  }, [list.data, filter]);
  const horizontalPadding = Math.max(layout.gutter, (width - layout.maxContentWidth) / 2);

  const save = () => {
    const t = title.trim();
    if (!t || add.isPending) return;
    add.mutate(
      { title: t, category },
      {
        onSuccess: () => {
          setTitle("");
          setOpen(false);
        },
        onError: (e) => toast({ kind: "error", message: humanError(e) }),
      },
    );
  };

  const onToggle = useCallback(
    (f: FutureItem) => {
      if (toggling || deleting || f.id.startsWith("optimistic-")) return;
      const willBeDone = !f.completedAt;
      if (willBeDone) {
        haptics.stamp();
        setBurst((b) => b + 1);
      } else haptics.tick();
      toggleItem({ id: f.id, done: willBeDone }, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
    },
    [toggleItem, toggling, deleting, toast],
  );

  const onLongPress = useCallback(
    (f: FutureItem) => {
      if (toggling || deleting || f.id.startsWith("optimistic-")) return;
      Alert.alert(f.title, undefined, [
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            deleteItem(f.id, {
              onError: (e) => toast({ kind: "error", message: humanError(e) }),
            }),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [toggling, deleting, deleteItem, toast],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <SectionList
        sections={list.isError ? [] : sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        renderItem={({ item }) => (
          <FutureRow f={item} pending={toggling || deleting} onToggle={onToggle} onLongPress={onLongPress} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text variant="label" color="action" style={{ paddingTop: 20, paddingBottom: 12 }}>
              {section.title}
            </Text>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => list.refetch()} tintColor={palette.action} />
        }
        ListHeaderComponent={
          <View style={{ gap: 20, paddingBottom: 20 }}>
            <TabHeader
              title="Our plans"
              subtitle="A little of what comes next, together."
              action={{ label: "Make a plan", icon: Plus, family: "green", onPress: () => setOpen(true) }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="All" family="green" selected={filter === "all"} onPress={() => setFilter("all")} />
              {CATS.map((c) => (
                <Chip
                  key={c}
                  label={FUTURE_CATEGORY_LABEL[c]}
                  family="green"
                  selected={filter === c}
                  onPress={() => setFilter(c)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          list.isPending ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={76} radius="paper" />
              <Skeleton height={76} radius="paper" />
            </View>
          ) : list.isError ? (
            <ErrorState onRetry={() => list.refetch()} />
          ) : (
            <EmptyState
              illustration={<MoodCreature mood={illustrations.empty.future} size={96} />}
              title="What's next for you two?"
              action={{ label: "Make a plan", onPress: () => setOpen(true) }}
              body="Places to go, films to watch, things to try. Add one and stamp it when you do it."
            />
          )
        }
      />

      <Sheet open={open} onClose={() => setOpen(false)} accessibilityLabel="Make a plan">
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text variant="display-m">Make a plan</Text>
          <TextField
            label="What is it?"
            editable={!add.isPending}
            value={title}
            onChangeText={setTitle}
            placeholder="Watch the sunrise together"
            maxLength={120}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATS.map((c) => (
              <Chip
                key={c}
                label={FUTURE_CATEGORY_LABEL[c]}
                family="green"
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
          <Button
            fullWidth
            label="Save our plan"
            disabled={!title.trim() || add.isPending}
            loading={add.isPending}
            onPress={save}
          />
        </View>
      </Sheet>
      <Confetti burst={burst} height={height} />
    </View>
  );
}

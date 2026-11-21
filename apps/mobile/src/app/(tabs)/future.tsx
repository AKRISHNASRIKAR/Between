import { FUTURE_CATEGORY_LABEL, type FutureCategory, type FutureItem } from "@lovenotes/contracts";
import { memo, useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Check,
  Chip,
  Confetti,
  EmptyState,
  ErrorState,
  FutureTicket,
  family,
  haptics,
  illustrations,
  layout,
  lift,
  MoodCreature,
  Plus,
  PressableScale,
  palette,
  radius,
  Sheet,
  Skeleton,
  space as sp,
  stroke,
  TabHeader,
  Text,
  TextField,
  useToast,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useAddFuture, useDeleteFuture, useFuture, useToggleFuture } from "@/features/future/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

const CATS: FutureCategory[] = ["dream", "place", "watch", "try", "goal"];
const addedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Added today" : days === 1 ? "Added yesterday" : `Added ${days} days ago`;
};
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

/** Plans · Next up (design decision 2026-11-21): the first open plan as a boarding pass. */
function NextUpPass({
  f,
  idea,
  onStamp,
  pending,
}: {
  f: FutureItem;
  idea: string;
  onStamp: () => void;
  pending: boolean;
}) {
  useThemeSubscription();
  const green = family("green");
  const notch = {
    position: "absolute" as const,
    top: -sp[2] - 1,
    width: sp[4] + 2,
    height: sp[4] + 2,
    borderRadius: radius.pill,
    backgroundColor: palette.canvas,
  };
  return (
    <View style={[{ backgroundColor: palette.paper, borderRadius: radius.paper * 2, overflow: "hidden" }, lift[2]]}>
      <View
        style={{
          backgroundColor: green.base,
          paddingHorizontal: sp[5],
          paddingVertical: sp[3],
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text variant="label" style={{ color: green.onBase }}>
          Next up
        </Text>
        <Text variant="label" style={{ color: green.onBase }}>
          {FUTURE_CATEGORY_LABEL[f.category]}
        </Text>
      </View>
      <View style={{ padding: sp[5], gap: sp[3] }}>
        <Text variant="display-m" accessibilityRole="header">
          {f.title}
        </Text>
        {f.note ? (
          <Text variant="body-sm" color="ink-secondary">
            {f.note}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: sp[6] }}>
          <View style={{ gap: sp[1] }}>
            <Text variant="caption" color="ink-tertiary">
              Idea
            </Text>
            <Text variant="body-sm-strong">{idea}</Text>
          </View>
          <View style={{ gap: sp[1] }}>
            <Text variant="caption" color="ink-tertiary">
              On the list
            </Text>
            <Text variant="body-sm-strong">{addedAgo(f.createdAt).replace("Added ", "Since ")}</Text>
          </View>
        </View>
      </View>
      <View
        style={{
          marginHorizontal: sp[4],
          borderTopWidth: stroke.illustration,
          borderStyle: "dashed",
          borderColor: palette.line,
        }}
      >
        <View style={[notch, { left: -sp[4] - sp[2] - 1 }]} />
        <View style={[notch, { right: -sp[4] - sp[2] - 1 }]} />
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: sp[4], padding: sp[4], paddingHorizontal: sp[5] }}
      >
        <Text variant="display-m" accessibilityElementsHidden importantForAccessibility="no">
          {f.emoji ?? "✦"}
        </Text>
        <View style={{ flex: 1 }}>
          <Button
            size="md"
            fullWidth
            label="Stamp it done"
            icon={Check}
            disabled={pending || f.id.startsWith("optimistic-")}
            onPress={onStamp}
          />
        </View>
      </View>
    </View>
  );
}

const PlanRow = memo(function PlanRow({
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
      accessibilityLabel={f.title}
      accessibilityHint="Tap to mark as done. Long-press to remove."
      onPress={() => onToggle(f)}
      onLongPress={() => onLongPress(f)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: sp[4],
        paddingVertical: sp[3],
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}
    >
      <View style={{ width: sp[10], alignItems: "center" }} accessibilityElementsHidden>
        <Text variant="heading">{f.emoji ?? "·"}</Text>
      </View>
      <View style={{ flex: 1, gap: sp[1] }}>
        <Text variant="body-sm-strong">{f.title}</Text>
        <Text variant="caption" color="ink-tertiary">
          {FUTURE_CATEGORY_LABEL[f.category]} · {addedAgo(f.createdAt)}
        </Text>
      </View>
      <CheckCircle done={false} />
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
  const [showDone, setShowDone] = useState(false);
  const partner = partnerOf(space, me.data?.profile.id);

  const { upcoming, done } = useMemo(() => {
    const items = (list.data ?? []).filter((f) => filter === "all" || f.category === filter);
    return { upcoming: items.filter((f) => !f.completedAt), done: items.filter((f) => f.completedAt) };
  }, [list.data, filter]);
  const [next, ...then] = upcoming;
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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
          gap: 24,
        }}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => list.refetch()} tintColor={palette.action} />
        }
      >
        <View style={{ gap: 20 }}>
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

        {list.isPending ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={220} radius="paper" />
            <Skeleton height={56} radius="paper" />
          </View>
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : !next && done.length === 0 ? (
          <EmptyState
            illustration={<MoodCreature mood={illustrations.empty.future} size={96} />}
            title="What's next for you two?"
            action={{ label: "Make a plan", onPress: () => setOpen(true) }}
            body="Places to go, films to watch, things to try. Add one and stamp it when you do it."
          />
        ) : (
          <>
            {next ? (
              <NextUpPass
                f={next}
                idea={next.createdBy === me.data?.profile.id ? "Yours" : (partner?.displayName ?? "Theirs")}
                pending={toggling || deleting}
                onStamp={() => onToggle(next)}
              />
            ) : (
              <Text variant="body" color="ink-secondary" align="center">
                Everything here is done. Time to dream up the next one.
              </Text>
            )}
            {then.length ? (
              <View>
                <Text variant="label" color="ink-tertiary" style={{ paddingBottom: 4 }}>
                  Then
                </Text>
                {then.map((f) => (
                  <PlanRow
                    key={f.id}
                    f={f}
                    pending={toggling || deleting}
                    onToggle={onToggle}
                    onLongPress={onLongPress}
                  />
                ))}
              </View>
            ) : null}
            {done.length ? (
              <View style={{ gap: 12 }}>
                <Button
                  variant="quiet"
                  label={showDone ? `Hide what you've done · ${done.length}` : `Made it happen · ${done.length}`}
                  onPress={() => setShowDone((v) => !v)}
                />
                {showDone
                  ? done.map((f) => (
                      <FutureRow
                        key={f.id}
                        f={f}
                        pending={toggling || deleting}
                        onToggle={onToggle}
                        onLongPress={onLongPress}
                      />
                    ))
                  : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

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

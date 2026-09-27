import { FUTURE_CATEGORY_LABEL, type FutureCategory, type FutureItem } from "@lovenotes/contracts";
import { useState } from "react";
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
  haptics,
  layout,
  MoodCreature,
  Plus,
  PressableScale,
  palette,
  Sheet,
  Skeleton,
  stroke,
  Text,
  TextField,
  useToast,
} from "@/design-system";
import { useAddFuture, useDeleteFuture, useFuture, useToggleFuture } from "@/features/future/hooks";
import { useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

const CATS: FutureCategory[] = ["dream", "place", "watch", "try", "goal"];
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase();

function CheckCircle({ done }: { done: boolean }) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: stroke.regular,
        borderColor: done ? palette["green-deep"] : palette["line-strong"],
        backgroundColor: done ? palette["green-base"] : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {done ? <Check size={16} color={palette.ink} weight="bold" /> : null}
    </View>
  );
}

/** BUILD (SPEC §4.5): tickets for what's next; stamp them when you do them. */
export default function Future() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const list = useFuture(space?.id);
  const add = useAddFuture(space?.id, me.data?.profile.id);
  const toggle = useToggleFuture(space?.id);
  const del = useDeleteFuture(space?.id);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FutureCategory>("dream");
  const [filter, setFilter] = useState<FutureCategory | "all">("all");
  const [burst, setBurst] = useState(0);

  const items = (list.data ?? []).filter((f) => filter === "all" || f.category === filter);
  const upcoming = items.filter((f) => !f.completedAt);
  const done = items.filter((f) => f.completedAt);

  const save = () => {
    const t = title.trim();
    if (!t) return;
    add.mutate({ title: t, category }, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
    setTitle("");
    setOpen(false);
  };

  const onToggle = (f: FutureItem) => {
    const willBeDone = !f.completedAt;
    if (willBeDone) {
      haptics.stamp();
      setBurst((b) => b + 1);
    } else haptics.tick();
    toggle.mutate({ id: f.id, done: willBeDone }, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
  };

  const onLongPress = (f: FutureItem) =>
    Alert.alert(f.title, undefined, [
      { text: "Remove", style: "destructive", onPress: () => del.mutate(f.id) },
      { text: "Cancel", style: "cancel" },
    ]);

  const Row = ({ f }: { f: FutureItem }) => (
    <PressableScale
      accessibilityLabel={`${f.title}${f.completedAt ? ", done" : ""}`}
      accessibilityHint={f.completedAt ? "Tap to mark as not done" : "Tap to stamp it done. Long-press to remove."}
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

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
          gap: 20,
        }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => list.refetch()} />}
      >
        <View style={{ gap: 4 }}>
          <Text variant="label" color="green-deep">
            Future
          </Text>
          <Text variant="display-l" accessibilityRole="header">
            Our future
          </Text>
        </View>
        <Button label="Add something" icon={Plus} onPress={() => setOpen(true)} />
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

        {list.isPending ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={76} radius="paper" />
            <Skeleton height={76} radius="paper" />
          </View>
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            illustration={<MoodCreature mood="excited" size={96} />}
            title="What's next for you two?"
            body="Places to go, films to watch, things to try. Add one and stamp it when you do it."
          />
        ) : (
          <>
            <View style={{ gap: 12 }}>
              {upcoming.map((f) => (
                <Row key={f.id} f={f} />
              ))}
            </View>
            {done.length ? (
              <View style={{ gap: 12 }}>
                <Text variant="label" color="green-deep">
                  Done ✦ {done.length}
                </Text>
                {done.map((f) => (
                  <Row key={f.id} f={f} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Sheet open={open} onClose={() => setOpen(false)} accessibilityLabel="Add to our future">
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text variant="display-m">Add to our future</Text>
          <TextField
            label="What is it?"
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
          <Button fullWidth label="Add it" disabled={!title.trim()} onPress={save} />
        </View>
      </Sheet>
      <Confetti burst={burst} height={height} />
    </View>
  );
}

import { useMemo, useState } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, Chip, ErrorState, layout, PhotoFrame, Screen, Skeleton, Text, useToast } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useExport, useRetainedSpaceExport } from "@/features/settings/hooks";
import { useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

type Archive = NonNullable<ReturnType<typeof useRetainedSpaceExport>["data"]>;
type ReadRow =
  | { id: string; kind: "heading" | "body" | "caption"; text: string }
  | { id: string; kind: "photo"; uri: string; aspect: number };

/** Each block, image, and answer is an independent row so large archives stay virtualized. */
function readRows(data: Archive): ReadRow[] {
  const rows: ReadRow[] = [];
  const text = (id: string, kind: "heading" | "body" | "caption", value: string) =>
    rows.push({ id, kind, text: value });
  const section = (id: string, title: string, count: number, empty: string) => {
    text(`section-${id}`, "heading", title);
    if (!count) text(`empty-${id}`, "caption", empty);
  };
  section("notes", "Notes", data.notes.length, "No notes remain.");
  for (const note of data.notes) {
    text(`note-date-${note.id}`, "caption", new Date(note.createdAt).toLocaleDateString());
    text(`note-${note.id}`, "body", note.body);
  }
  section("journal", "Journal & photos", data.journal.length, "No journal pages remain.");
  for (const page of data.journal) {
    text(`page-${page.id}`, "heading", page.title ?? page.pageDate);
    for (const block of page.blocks) {
      if (block.body) text(`block-${block.id}`, "body", block.body);
      for (const photo of block.media) {
        rows.push({
          id: `photo-${block.id}-${photo.id}`,
          kind: "photo",
          uri: photo.thumbUrl,
          aspect: photo.width / photo.height,
        });
        if (photo.caption) text(`photo-caption-${block.id}-${photo.id}`, "caption", photo.caption);
      }
    }
  }
  section("future", "Our future", data.future.length, "No future plans remain.");
  for (const item of data.future) {
    text(`future-${item.id}`, "body", `${item.completedAt ? "✓ " : ""}${item.title}`);
    if (item.note) text(`future-note-${item.id}`, "caption", item.note);
  }
  section("moods", "Moods", data.moods.length, "No moods remain.");
  for (const mood of data.moods) {
    const id = `${mood.date}-${mood.userId}`;
    text(`mood-${id}`, "body", `${mood.date} · ${mood.mood}`);
    if (mood.note) text(`mood-note-${id}`, "caption", mood.note);
  }
  section("quizzes", "Quizzes", data.quizzes.length, "No quizzes remain.");
  for (const quiz of data.quizzes) {
    text(`quiz-${quiz.id}`, "heading", quiz.pack?.title ?? quiz.dailyDate ?? "Daily question");
    const mine = new Map(quiz.myAnswers.map((answer) => [answer.questionId, answer]));
    const theirs = new Map((quiz.partnerAnswers ?? []).map((answer) => [answer.questionId, answer]));
    for (const question of quiz.questions) {
      const id = `${quiz.id}-${question.id}`;
      text(`question-${id}`, "body", question.promptSelf);
      for (const [who, answer] of [
        ["You", mine.get(question.id)],
        ["Your person", theirs.get(question.id)],
      ] as const) {
        if (!answer) continue;
        const value =
          answer.text ??
          question.options?.find((option) => option.id === answer.choice)?.label ??
          answer.choice ??
          data.members.find((member) => member.id === answer.whoUserId)?.name ??
          "—";
        text(`answer-${who}-${id}`, "caption", `${who}: ${value}`);
      }
    }
  }
  return rows;
}

/** A closed space has a separate reader so no active-space mutations are exposed. */
export default function ClosedSpaces() {
  useThemeSubscription();
  const me = useMe();
  const [chosen, setChosen] = useState<string>();
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(1, Math.min(width - layout.gutter * 2, layout.maxContentWidth));
  const retained = (me.data?.retainedSpaces ?? []).filter((space) => Date.parse(space.purgeAfter) > Date.now());
  const selected = retained.find((space) => space.id === chosen) ?? retained[0];
  const archive = useRetainedSpaceExport(selected?.id);
  const download = useExport(selected?.id);
  const toast = useToast();
  const data = selected && !archive.isError ? archive.data : undefined;
  const rows = useMemo(() => (data ? readRows(data) : []), [data]);

  return (
    <Screen scroll={false}>
      <FlatList<ReadRow>
        key={selected?.id ?? "empty"}
        data={rows}
        keyExtractor={(row) => row.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        ListHeaderComponent={
          <View className="gap-6 pb-6">
            <BackButton />
            <Text variant="display-l">Closed spaces</Text>
            <Text variant="body" color="ink-secondary">
              Read and export what remains of your space before its 30-day window ends.
            </Text>
            {me.isError ? (
              <ErrorState body={humanError(me.error)} onRetry={() => me.refetch()} retrying={me.isFetching} />
            ) : me.isPending ? (
              <Skeleton height={80} />
            ) : !selected ? (
              <Text variant="body">There are no closed spaces within their reading window.</Text>
            ) : (
              <>
                <View className="flex-row flex-wrap gap-2">
                  {retained.map((space) => (
                    <Chip
                      key={space.id}
                      family="sky"
                      label={space.name}
                      selected={space.id === selected.id}
                      onPress={() => setChosen(space.id)}
                    />
                  ))}
                </View>
                <Text variant="caption" color="ink-secondary">
                  Available until {new Date(selected.purgeAfter).toLocaleDateString()}. This space is read-only.
                </Text>
                <Button
                  label="Export this space"
                  loading={download.isPending}
                  onPress={() =>
                    download.mutate(undefined, {
                      onError: (error) => toast({ kind: "error", message: humanError(error) }),
                    })
                  }
                />
                {archive.isError ? (
                  <ErrorState
                    body={humanError(archive.error)}
                    onRetry={() => archive.refetch()}
                    retrying={archive.isFetching}
                  />
                ) : !data ? (
                  <Skeleton height={120} />
                ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{ paddingBottom: item.kind === "heading" ? 16 : 12, paddingTop: item.kind === "heading" ? 12 : 0 }}
          >
            {item.kind === "photo" ? (
              <PhotoFrame id={item.id} uri={item.uri} width={contentWidth} aspect={item.aspect} tilt={false} />
            ) : (
              <Text
                variant={item.kind === "caption" ? "body-sm" : item.kind}
                color={item.kind === "caption" ? "ink-secondary" : "ink"}
              >
                {item.text}
              </Text>
            )}
          </View>
        )}
      />
    </Screen>
  );
}

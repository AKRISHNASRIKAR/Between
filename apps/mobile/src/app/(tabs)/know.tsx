import type { QuizSessionSummary } from "@lovenotes/contracts";
import { RESULT_COPY } from "@lovenotes/contracts";
import { router } from "expo-router";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretRight,
  EmptyState,
  ErrorState,
  enter,
  layout,
  MoodCreature,
  PressableScale,
  palette,
  QuizCard,
  radius,
  Skeleton,
  TabHeader,
  Text,
  useToast,
} from "@/design-system";
import { DailyCard } from "@/features/quizzes/DailyCard";
import { useDaily, usePacks, useQuizSessions, useStartQuiz } from "@/features/quizzes/hooks";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

function statusOf(
  s: QuizSessionSummary,
  partner: string,
): { text: string; tone: "ink-secondary" | "purple-deep" | "green-deep" } {
  if (s.readyAt && !s.revealSeenAt) return { text: "Ready to reveal ✦", tone: "purple-deep" };
  if (s.result) return { text: RESULT_COPY[s.result.label].title, tone: "green-deep" };
  if (s.myCompletedAt)
    return { text: `Waiting for ${partner} · ${s.partnerAnsweredCount}/${s.questionCount}`, tone: "ink-secondary" };
  if (s.partnerCompletedAt) return { text: `${partner} is done — your turn`, tone: "purple-deep" };
  return { text: `In progress · ${s.myAnsweredCount}/${s.questionCount}`, tone: "ink-secondary" };
}

/** KNOW (SPEC §4.2): today's question, packs to play, and your quizzes. */
export default function Know() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const partnerName = partner?.displayName ?? "them";
  const packs = usePacks();
  const sessions = useQuizSessions(space?.id);
  const daily = useDaily(space?.id);
  const start = useStartQuiz(space?.id);
  const toast = useToast();
  const tileW = (Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2 - 12) / 2;

  const openPack = (packId: string) => {
    const active = sessions.data?.find((s) => s.pack?.id === packId && !s.readyAt);
    if (active) return router.push(`/quiz/${active.id}`);
    start.mutate(packId, {
      onSuccess: (s) => router.push(`/quiz/${s.id}`),
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });
  };

  const refresh = () => Promise.all([packs.refetch(), sessions.refetch(), daily.refetch()]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      contentContainerStyle={{
        paddingHorizontal: layout.gutter,
        paddingTop: insets.top + 16,
        paddingBottom: 32,
        gap: 28,
      }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
    >
      <TabHeader title="Know each other" />

      <DailyCard daily={daily.data} loading={daily.isPending} partnerName={partnerName} />

      <View style={{ gap: 12 }}>
        <Text variant="label" color="ink-tertiary">
          Pick a quiz
        </Text>
        {packs.isPending ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ width: tileW }}>
              <Skeleton height={190} radius="lg" />
            </View>
            <View style={{ width: tileW }}>
              <Skeleton height={190} radius="lg" />
            </View>
          </View>
        ) : packs.isError ? (
          <ErrorState onRetry={() => packs.refetch()} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {(packs.data ?? []).map((p, i) => (
              <Animated.View key={p.id} entering={enter(i)} style={{ width: tileW }}>
                <PressableScale
                  accessibilityLabel={`${p.title}. ${p.questionCount} questions.`}
                  disabled={start.isPending}
                  onPress={() => openPack(p.id)}
                >
                  <QuizCard category={p.category} title={p.title} meta={`${p.questionCount} questions`} />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="label" color="ink-tertiary">
          Your quizzes
        </Text>
        {sessions.isPending ? (
          <Skeleton height={64} radius="md" />
        ) : (sessions.data ?? []).length === 0 ? (
          <EmptyState
            illustration={<MoodCreature mood="confused" size={88} />}
            title="None yet"
            body={`Pick one above. ${partnerName} answers too, and you reveal together.`}
          />
        ) : (
          (sessions.data ?? []).map((s) => {
            const st = statusOf(s, partnerName);
            return (
              <PressableScale
                key={s.id}
                accessibilityLabel={`${s.pack?.title}: ${st.text}`}
                onPress={() => router.push(`/quiz/${s.id}`)}
                style={{
                  backgroundColor: palette.paper,
                  borderRadius: radius.md,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="heading">{s.pack?.title}</Text>
                  <Text variant="body-sm" color={st.tone}>
                    {st.text}
                  </Text>
                </View>
                <CaretRight size={18} color={palette["ink-tertiary"]} weight="bold" />
              </PressableScale>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

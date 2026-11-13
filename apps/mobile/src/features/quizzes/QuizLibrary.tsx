import type { QuizPackSummary, QuizSession, QuizSessionSummary } from "@lovenotes/contracts";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretRight,
  CategoryCreature,
  ErrorState,
  layout,
  PressableScale,
  palette,
  radius,
  Skeleton,
  space,
  TabHeader,
  Text,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { DailyCard } from "./DailyCard";

type Row =
  | { type: "heading"; id: string; title: string; body?: string }
  | { type: "pack"; id: string; pack: QuizPackSummary }
  | { type: "session"; id: string; session: QuizSessionSummary };
export function QuizLibrary({
  packs,
  sessions,
  daily,
  partnerName,
  packsLoading,
  sessionsLoading,
  dailyLoading,
  packsFailed,
  sessionsFailed,
  dailyFailed,
  refreshing,
  starting,
  onRefresh,
  onStart,
  onOpen,
}: {
  packs: QuizPackSummary[];
  sessions: QuizSessionSummary[];
  daily?: QuizSession | null;
  partnerName: string;
  packsLoading?: boolean;
  sessionsLoading?: boolean;
  dailyLoading?: boolean;
  packsFailed?: boolean;
  sessionsFailed?: boolean;
  dailyFailed?: boolean;
  refreshing?: boolean;
  starting?: boolean;
  onRefresh: () => void;
  onStart: (packId: string) => void;
  onOpen: (sessionId: string) => void;
}) {
  useThemeSubscription();
  const insets = useSafeAreaInsets();
  const ongoing = sessions.filter((s) => !s.revealSeenAt);
  const reports = sessions.filter((s) => !!s.revealSeenAt);
  const rows: Row[] = [];
  if (ongoing.length) {
    rows.push({ type: "heading", id: "ongoing", title: "Between you two", body: "Your conversations in progress." });
    rows.push(...ongoing.map((session): Row => ({ type: "session", id: session.id, session })));
  }
  rows.push({
    type: "heading",
    id: "browse",
    title: "Find a little more",
    body: "Pick a topic. Answer in your own time.",
  });
  rows.push(...packs.map((pack): Row => ({ type: "pack", id: pack.id, pack })));
  rows.push({
    type: "heading",
    id: "reports",
    title: "Your discoveries",
    body: reports.length ? "Answers worth coming back to." : "Your finished quizzes will live here.",
  });
  rows.push(...reports.map((session): Row => ({ type: "session", id: session.id, session })));
  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => `${row.type}:${row.id}`}
      style={{ flex: 1, backgroundColor: palette.canvas }}
      contentContainerStyle={{
        paddingHorizontal: layout.gutter,
        paddingTop: insets.top + space[4],
        paddingBottom: space[8],
        width: "100%",
        maxWidth: layout.maxContentWidth + layout.gutter * 2,
        alignSelf: "center",
      }}
      ItemSeparatorComponent={() => <View style={{ height: space[3] }} />}
      refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={palette.action} />}
      ListHeaderComponent={
        <View style={{ gap: space[5], paddingBottom: space[3] }}>
          <View style={{ gap: space[2] }}>
            <TabHeader title="Know each other" />
            <Text variant="body" color="ink-secondary">
              Small questions. More of your person.
            </Text>
          </View>
          {dailyFailed ? (
            <ErrorState
              body="Today's question couldn't load. Your saved quizzes are still below."
              onRetry={onRefresh}
            />
          ) : (
            <DailyCard daily={daily} loading={!!dailyLoading} partnerName={partnerName} />
          )}
          {packsLoading || sessionsLoading ? <Skeleton height={space[20]} radius="md" /> : null}
          {packsFailed || sessionsFailed ? (
            <ErrorState
              body={packsFailed ? "Quiz topics couldn't load." : "Your saved quizzes couldn't load."}
              onRetry={onRefresh}
            />
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        if (item.type === "heading")
          return (
            <View style={{ gap: space[1], paddingTop: space[5], paddingBottom: space[1] }}>
              <Text variant="heading" accessibilityRole="header">
                {item.title}
              </Text>
              {item.body ? (
                <Text variant="body-sm" color="ink-secondary">
                  {item.body}
                </Text>
              ) : null}
            </View>
          );
        const pack = item.type === "pack" ? item.pack : item.session.pack;
        const session = item.type === "session" ? item.session : null;
        const ready = !!session?.readyAt;
        const status = session
          ? ready
            ? session.revealSeenAt
              ? "Read your answers"
              : "Your answers are ready"
            : session.myCompletedAt
              ? `Your part is done · ${partnerName}'s turn`
              : session.partnerCompletedAt
                ? `${partnerName} has answered · Your turn`
                : `Continue · ${session.myAnsweredCount} of ${session.questionCount} saved`
          : `${pack?.questionCount ?? 0} questions · Answer separately`;
        return (
          <PressableScale
            disabled={item.type === "pack" && starting}
            accessibilityLabel={`${pack?.title ?? "Your question"}. ${status}`}
            onPress={() => (session ? onOpen(session.id) : pack && onStart(pack.id))}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space[4],
              backgroundColor: palette.paper,
              padding: layout.cardPaddingCompact,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: ready && !session?.revealSeenAt ? palette.action : palette.line,
            }}
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <CategoryCreature category={pack?.category ?? "daily"} size={48} />
            </View>
            <View style={{ flex: 1, gap: space[2] }}>
              <Text variant="heading">{pack?.title ?? "Today's question"}</Text>
              {item.type === "pack" ? (
                <Text variant="body-sm" color="ink-secondary">
                  {item.pack.subtitle}
                </Text>
              ) : null}
              <Text variant="caption" color={ready || session?.partnerCompletedAt ? "action" : "ink-secondary"}>
                {status}
              </Text>
            </View>
            <CaretRight size={18} color={palette.action} />
          </PressableScale>
        );
      }}
    />
  );
}

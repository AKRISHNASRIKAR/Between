import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { ErrorState, Screen, Skeleton } from "@/design-system";
import { useQuizSession } from "@/features/quizzes/hooks";
import { QuizPlay } from "@/features/quizzes/QuizPlay";
import { QuizReveal } from "@/features/quizzes/QuizReveal";
import { QuizWaiting } from "@/features/quizzes/QuizWaiting";
import { partnerOf, useMe } from "@/features/space/hooks";

/** One screen, three states: play → waiting → reveal (SPEC §5.4 quiz states). */
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id ?? "";
  const partner = partnerOf(space, myId);
  const session = useQuizSession(space?.id, id);
  const s = session.data;

  const meInfo = { id: myId, name: me.data?.profile.displayName ?? "You", avatar: me.data?.profile.avatarUrl ?? null };
  const partnerInfo = {
    id: partner?.id ?? "",
    name: partner?.displayName ?? "them",
    avatar: partner?.avatarUrl ?? null,
  };

  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 8, paddingBottom: 24 }}>
        <BackButton />
        {session.isPending ? (
          <Skeleton height={360} radius="xl" />
        ) : session.isError || !s || !space ? (
          <ErrorState onRetry={() => session.refetch()} retrying={session.isFetching} />
        ) : s.readyAt ? (
          <QuizReveal session={s} spaceId={space.id} me={meInfo} partner={partnerInfo} />
        ) : s.myCompletedAt ? (
          <QuizWaiting session={s} partnerName={partnerInfo.name} />
        ) : (
          <QuizPlay session={s} spaceId={space.id} me={meInfo} partner={partnerInfo} />
        )}
      </View>
    </Screen>
  );
}

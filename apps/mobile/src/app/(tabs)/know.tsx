import { router } from "expo-router";
import { useRef } from "react";
import { useToast } from "@/design-system";
import { useDaily, usePacks, useQuizSessions, useStartQuiz } from "@/features/quizzes/hooks";
import { QuizLibrary } from "@/features/quizzes/QuizLibrary";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

export default function Know() {
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const packs = usePacks();
  const sessions = useQuizSessions(space?.id);
  const daily = useDaily(space?.id);
  const start = useStartQuiz(space?.id);
  const opening = useRef(false);
  const toast = useToast();
  const openPack = (packId: string) => {
    if (opening.current || start.isPending) return;
    const active = sessions.data?.find((s) => s.pack?.id === packId && !s.readyAt);
    if (active) return router.push(`/quiz/${active.id}`);
    opening.current = true;
    start.mutate(packId, {
      onSuccess: (s) => router.push(`/quiz/${s.id}`),
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
      onSettled: () => {
        opening.current = false;
      },
    });
  };
  return (
    <QuizLibrary
      packs={packs.data ?? []}
      sessions={sessions.data ?? []}
      daily={daily.data}
      partnerName={partner?.displayName ?? "your partner"}
      packsLoading={packs.isPending}
      sessionsLoading={sessions.isPending}
      dailyLoading={daily.isPending}
      packsFailed={packs.isError}
      sessionsFailed={sessions.isError}
      dailyFailed={daily.isError}
      refreshing={packs.isRefetching || sessions.isRefetching || daily.isRefetching}
      starting={start.isPending}
      onRefresh={() => {
        void Promise.all([packs.refetch(), sessions.refetch(), daily.refetch()]);
      }}
      onStart={openPack}
      onOpen={(id) => router.push(`/quiz/${id}`)}
    />
  );
}

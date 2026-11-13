import type { AnswerInput, QuizSession } from "@lovenotes/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { newId } from "@/lib/ids";
import { rollbackOptimistic } from "@/lib/optimistic";

export const quizKeys = {
  packs: ["quiz-packs"] as const,
  all: (sid: string) => ["space", sid, "quiz"] as const,
  sessions: (sid: string) => ["space", sid, "quiz", "sessions"] as const,
  session: (sid: string, id: string) => ["space", sid, "quiz", "session", id] as const,
  daily: (sid: string) => ["space", sid, "quiz", "daily"] as const,
};

export function usePacks() {
  return useQuery({
    queryKey: quizKeys.packs,
    queryFn: () => unwrap(api["quiz-packs"].$get()),
    staleTime: 10 * 60_000,
  });
}

export function useQuizSessions(spaceId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.sessions(spaceId ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].quizzes.$get({ param: { sid: spaceId ?? "" } })),
    enabled: !!spaceId,
  });
}

export function useQuizSession(spaceId: string | undefined, id: string) {
  return useQuery({
    queryKey: quizKeys.session(spaceId ?? "", id),
    queryFn: () => unwrap(api.spaces[":sid"].quizzes[":qid"].$get({ param: { sid: spaceId ?? "", qid: id } })),
    enabled: !!spaceId && !!id,
  });
}

export function useDaily(spaceId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.daily(spaceId ?? ""),
    queryFn: () => unwrap(api.spaces[":sid"].daily.$get({ param: { sid: spaceId ?? "" } })),
    enabled: !!spaceId,
  });
}

export function useStartQuiz(spaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packId: string) =>
      unwrap(api.spaces[":sid"].quizzes.$post({ param: { sid: spaceId ?? "" }, json: { id: newId(), packId } })),
    onSuccess: (s) => {
      qc.setQueryData(quizKeys.session(spaceId ?? "", s.id), s);
      qc.invalidateQueries({ queryKey: quizKeys.sessions(spaceId ?? "") });
    },
  });
}

/** Optimistic: the answer shows as saved immediately; server copy replaces it. */
export function useAnswer(spaceId: string | undefined, sessionId: string) {
  const qc = useQueryClient();
  const key = quizKeys.session(spaceId ?? "", sessionId);
  return useMutation({
    mutationKey: key,
    scope: { id: key.join(":") },
    mutationFn: ({ questionId, input }: { questionId: string; input: AnswerInput }) =>
      unwrap(
        api.spaces[":sid"].quizzes[":qid"].answers[":questionId"].$put({
          param: { sid: spaceId ?? "", qid: sessionId, questionId },
          json: input,
        }),
      ),
    onMutate: async ({ questionId, input }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<QuizSession>(key);
      qc.setQueryData<QuizSession>(key, (s) => {
        if (!s) return s;
        const rest = s.myAnswers.filter((a) => a.questionId !== questionId);
        return {
          ...s,
          myAnswers: [
            ...rest,
            {
              questionId,
              choice: input.choice ?? null,
              guess: input.guess ?? null,
              whoUserId: input.who ?? null,
              text: input.text ?? null,
            },
          ],
        };
      });
      return { prev, optimistic: qc.getQueryData<QuizSession>(key) };
    },
    onError: (_error, _input, ctx) => rollbackOptimistic(qc, key, ctx),
    onSuccess: (s, _input, ctx) => {
      if (qc.getQueryData(key) === ctx?.optimistic) qc.setQueryData(key, s);
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey: key }) === 1) return qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCompleteQuiz(spaceId: string | undefined, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(api.spaces[":sid"].quizzes[":qid"].complete.$post({ param: { sid: spaceId ?? "", qid: sessionId } })),
    onSuccess: (s) => {
      qc.setQueryData(quizKeys.session(spaceId ?? "", sessionId), s);
      qc.invalidateQueries({ queryKey: quizKeys.all(spaceId ?? "") });
    },
  });
}

export function useMarkRevealSeen(spaceId: string | undefined, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(api.spaces[":sid"].quizzes[":qid"].seen.$post({ param: { sid: spaceId ?? "", qid: sessionId } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all(spaceId ?? "") }),
  });
}

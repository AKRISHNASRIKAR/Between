import { AnswerInput, type QuizSession, withPartner } from "@lovenotes/contracts";
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { z } from "zod";
import {
  ArrowLeft,
  Avatar,
  Button,
  CATEGORY_LABEL,
  Check,
  LockSimple,
  layout,
  PressableScale,
  palette,
  radius,
  space,
  Text,
  TextField,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { humanError } from "@/lib/errors";
import { useDraft } from "@/lib/use-draft";
import { answerLabel, questionAnswered, resumeQuestionIndex } from "./answer-view";
import { ChoiceGrid } from "./ChoiceGrid";
import { useAnswer, useCompleteQuiz } from "./hooks";
import { OptionRow } from "./OptionRow";

type Person = { id: string; name: string; avatar: string | null };
type Props = { session: QuizSession; spaceId: string; me: Person; partner: Person; onStepChange?: () => void };

const QuizDraft = z.object({ picks: z.record(z.string(), AnswerInput) });
type QuizDraft = z.infer<typeof QuizDraft>;
const emptyQuizDraft = (): QuizDraft => ({ picks: {} });
const validQuizDraft = (value: unknown): value is QuizDraft => QuizDraft.safeParse(value).success;

export function QuizPlay(props: Props) {
  const local = useDraft(
    { userId: props.me.id, spaceId: props.spaceId, editor: `quiz:${props.session.id}` },
    emptyQuizDraft,
    validQuizDraft,
  );
  const save = useAnswer(props.spaceId, props.session.id);
  const complete = useCompleteQuiz(props.spaceId, props.session.id);
  return (
    <QuizPlayContent
      {...props}
      key={`${props.me.id}:${props.spaceId}:${props.session.id}`}
      initialDrafts={local.value.picks}
      onDraftChange={(questionId, input) => local.update((old) => ({ picks: { ...old.picks, [questionId]: input } }))}
      draftSaved={local.savedLocally}
      onSave={async (questionId, input) => {
        const response = await save.mutateAsync({ questionId, input });
        local.update((old) => {
          const pick = old.picks[questionId];
          if (
            !pick ||
            pick.choice !== input.choice ||
            pick.guess !== input.guess ||
            pick.who !== input.who ||
            (pick.text ?? "").trim() !== (input.text ?? "").trim()
          )
            return old;
          const picks = { ...old.picks };
          delete picks[questionId];
          return { picks };
        });
        return response;
      }}
      onComplete={async () => {
        const token = { id: local.id, revision: local.revision };
        const response = await complete.mutateAsync();
        local.acknowledge(token);
        return response;
      }}
    />
  );
}

/** Presentational flow is also used by the isolated, development-only quiz playground. */
export function QuizPlayContent({
  session,
  me,
  partner,
  onSave,
  onComplete,
  onStepChange,
  initialField = "choice",
  initialDrafts = {},
  onDraftChange,
  draftSaved,
}: Omit<Props, "spaceId"> & {
  initialField?: "choice" | "guess";
  initialDrafts?: Record<string, AnswerInput>;
  onDraftChange?: (questionId: string, input: AnswerInput) => void;
  draftSaved?: boolean;
  onSave: (questionId: string, input: AnswerInput) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
}) {
  useThemeSubscription();
  const answers = useMemo(() => new Map(session.myAnswers.map((a) => [a.questionId, a])), [session.myAnswers]);
  const [index, setIndex] = useState(() => resumeQuestionIndex(session.questions, session.myAnswers, initialDrafts));
  const [drafts, setDrafts] = useState<Record<string, AnswerInput>>(initialDrafts);
  const [field, setField] = useState<"choice" | "guess">(initialField);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const returnToReview = useRef(false);
  const q = session.questions[index];
  const current = q ? answers.get(q.id) : undefined;
  const draft = drafts[q?.id ?? ""] ?? {};
  const choice = draft.choice ?? current?.choice ?? null;
  const guess = draft.guess ?? current?.guess ?? null;
  const who =
    draft.who ??
    (current?.whoUserId ? (current.whoUserId === me.id || current.whoUserId === "me" ? "me" : "partner") : undefined);
  const text = draft.text ?? current?.text ?? "";
  const updateDraft = (patch: AnswerInput) => {
    if (!q) return;
    setError(null);
    const next: AnswerInput =
      q.kind === "choice"
        ? { choice: choice ?? undefined, guess: guess ?? undefined, ...patch }
        : q.kind === "who"
          ? { who, ...patch }
          : { text, ...patch };
    setDrafts((old) => ({ ...old, [q.id]: next }));
    onDraftChange?.(q.id, next);
  };
  const people = [me, partner, { id: "me", name: me.name }, { id: "partner", name: partner.name }];
  const moveTo = (next: number) => {
    setIndex(next);
    setField("choice");
    setError(null);
    onStepChange?.();
  };
  const submit = async (finish: boolean) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      if (finish) await onComplete();
      else if (q) {
        const input: AnswerInput =
          q.kind === "choice"
            ? { choice: choice ?? undefined, guess: guess ?? undefined }
            : q.kind === "who"
              ? { who }
              : { text: text.trim() };
        await onSave(q.id, input);
        moveTo(returnToReview.current ? session.questions.length : index + 1);
        returnToReview.current = false;
      }
    } catch (e) {
      setError(humanError(e));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const completed = session.questions.filter((question) => questionAnswered(question, answers.get(question.id))).length;
  return (
    <View style={{ gap: space[6] }}>
      <View style={{ gap: space[3] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <Text variant="label" color="action" style={{ flex: 1 }}>
            {CATEGORY_LABEL[session.pack?.category ?? "daily"]}
          </Text>
          <Text variant="caption" color="ink-secondary">
            {q ? `${index + 1} of ${session.questions.length}` : `${completed} of ${session.questions.length} saved`}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Questions saved"
          accessibilityValue={{ min: 0, max: session.questions.length, now: completed }}
          style={{ flexDirection: "row", gap: space[1] }}
        >
          {session.questions.map((question, i) => (
            <View
              key={question.id}
              style={{
                flex: 1,
                height: space[1],
                borderRadius: radius.pill,
                backgroundColor: questionAnswered(question, answers.get(question.id))
                  ? palette.action
                  : i === index
                    ? palette.highlight
                    : palette.sunken,
              }}
            />
          ))}
        </View>
        <Text variant="body-sm" color="ink-secondary">
          {session.pack?.title ?? "Today's question"}
        </Text>
      </View>
      {!q ? (
        <>
          <View style={{ gap: space[3] }}>
            <Text variant="display-l" accessibilityRole="header">
              A final look.
            </Text>
            <Text variant="body" color="ink-secondary">
              Your answers and your guesses, all in one place. Tap any question to change a pick before sending.
            </Text>
          </View>
          {session.questions.map((question, i) => (
            <PressableScale
              key={question.id}
              disabled={busy}
              accessibilityLabel={`Edit question ${i + 1}: ${withPartner(question.promptSelf, partner.name)}`}
              onPress={() => {
                returnToReview.current = true;
                moveTo(i);
              }}
              style={{
                padding: layout.cardPadding,
                gap: space[3],
                borderRadius: radius.lg,
                borderCurve: "continuous",
                backgroundColor: palette.paper,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
                <Text variant="caption" color="ink-secondary" style={{ flex: 1 }}>
                  QUESTION {i + 1}
                </Text>
                <Text variant="body-sm-strong" color="action">
                  Edit
                </Text>
              </View>
              <Text variant="heading">{withPartner(question.promptSelf, partner.name)}</Text>
              <View style={{ gap: space[2] }}>
                <Text variant="body-sm">
                  <Text variant="body-sm-strong">You: </Text>
                  {answerLabel(question, answers.get(question.id), "choice", people)}
                </Text>
                {question.kind === "choice" ? (
                  <Text variant="body-sm" color="ink-secondary">
                    Your guess for {partner.name}: {answerLabel(question, answers.get(question.id), "guess", people)}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
          ))}
        </>
      ) : (
        <>
          <Text variant="display-m" accessibilityRole="header">
            {withPartner(q.promptSelf, partner.name)}
          </Text>
          {q.kind === "choice" ? (
            <ChoiceGrid
              options={q.options ?? []}
              choice={choice}
              guess={guess}
              field={field}
              onFieldChange={setField}
              partnerName={partner.name}
              disabled={busy}
              onPick={(key, value) => updateDraft({ [key]: value })}
            />
          ) : q.kind === "who" ? (
            <View style={{ gap: space[3] }} accessibilityRole="radiogroup" accessibilityLabel="Choose one of you">
              <Text variant="body" color="ink-secondary">
                Who comes to mind?
              </Text>
              {[
                { value: "me" as const, person: me, label: `You · ${me.name}`, ring: "you" as const },
                { value: "partner" as const, person: partner, label: partner.name, ring: "partner" as const },
              ].map((item) => (
                <OptionRow
                  key={item.value}
                  label={item.label}
                  leading={<Avatar size={28} name={item.person.name} uri={item.person.avatar} who={item.ring} />}
                  selected={who === item.value}
                  disabled={busy}
                  onPress={() => updateDraft({ who: item.value })}
                />
              ))}
            </View>
          ) : (
            <View style={{ gap: space[3] }}>
              <TextField
                label="In your own words"
                multiline
                editable={!busy}
                value={text}
                onChangeText={(value) => updateDraft({ text: value })}
                maxLength={280}
                placeholder="A thought, a memory, a little honesty…"
              />
              <Text variant="caption" color="ink-secondary">
                {text.length}/280 · There is no right answer.
              </Text>
            </View>
          )}
        </>
      )}
      <View style={{ gap: space[3] }}>
        {draftSaved === false ? (
          <Text variant="caption" color="tomato-deep">
            Your unsent picks could not be saved locally. Keep this screen open.
          </Text>
        ) : onDraftChange ? (
          <Text variant="caption" color="ink-secondary">
            Unsent picks are saved on this phone. Sending needs a connection.
          </Text>
        ) : null}
        {error ? (
          <Text variant="body-sm" color="tomato-deep" accessibilityRole="alert">
            {error} Your picks are still here. Try again.
          </Text>
        ) : null}
        {q?.kind === "choice" && (!choice || !guess) ? (
          <Button
            fullWidth
            label={!choice ? "Choose your answer above" : `Choose your guess for ${partner.name}`}
            disabled={!choice || busy}
            onPress={() => setField("guess")}
          />
        ) : (
          <Button
            fullWidth
            label={
              !q
                ? "Send my answers"
                : returnToReview.current || index === session.questions.length - 1
                  ? "Review my answers"
                  : "Save & next question"
            }
            loading={busy}
            disabled={
              !q
                ? completed !== session.questions.length || busy
                : busy || (q.kind === "who" ? !who : q.kind === "open" ? !text.trim() : !choice || !guess)
            }
            onPress={() => void submit(!q)}
          />
        )}
        {q && index > 0 ? (
          <Button
            variant="quiet"
            icon={ArrowLeft}
            label="Previous question"
            disabled={busy}
            onPress={() => {
              returnToReview.current = false;
              moveTo(index - 1);
            }}
          />
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space[2] }}>
          {q ? (
            <LockSimple size={16} color={palette["ink-secondary"]} />
          ) : (
            <Check size={16} color={palette["ink-secondary"]} />
          )}
          <Text variant="caption" color="ink-secondary" style={{ flex: 1 }}>
            {!q
              ? `Sending locks your answers. You'll see both sets once ${partner.name} has finished too.`
              : `${partner.name} answers on their own phone. Both sets stay private until you’ve both sent them.`}
          </Text>
        </View>
      </View>
    </View>
  );
}

import type { AnswerInput } from "@lovenotes/contracts";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Screen, space, Text, useTheme } from "@/design-system";
import { QuizLibrary } from "@/features/quizzes/QuizLibrary";
import { QuizPlayContent } from "@/features/quizzes/QuizPlay";
import { QuizReport } from "@/features/quizzes/QuizReveal";
import { QuizWaiting } from "@/features/quizzes/QuizWaiting";
import { quizFixture, quizPeople } from "@/features/quizzes/quiz-fixtures";

export default function QuizPlayground() {
  const params = useLocalSearchParams<{ scene?: string; mode?: string; controls?: string }>();
  const theme = useTheme();
  const [scene, setScene] = useState(params.scene ?? "play");
  const [session, setSession] = useState(() => quizFixture(params.scene ?? "play"));
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (!__DEV__) return;
    const next = params.scene ?? "play";
    setScene(next);
    setSession(quizFixture(next));
    if (params.mode === "light" || params.mode === "dark") theme.setPreference(params.mode);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [params.scene, params.mode, theme.setPreference]);
  if (!__DEV__) return <Redirect href="/" />;
  const select = (next: string) => {
    setScene(next);
    setSession(quizFixture(next));
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const save = async (questionId: string, input: AnswerInput) => {
    setSession((old) => ({
      ...old,
      myAnswers: [
        ...old.myAnswers.filter((a) => a.questionId !== questionId),
        {
          questionId,
          choice: input.choice ?? null,
          guess: input.guess ?? null,
          text: input.text ?? null,
          whoUserId: input.who ? quizPeople[input.who === "me" ? "me" : "partner"].id : null,
        },
      ],
    }));
  };
  const samplePack = quizFixture("play").pack;
  if (scene === "library")
    return (
      <QuizLibrary
        packs={samplePack ? [samplePack] : []}
        sessions={[]}
        daily={null}
        partnerName={quizPeople.partner.name}
        onRefresh={() => {}}
        onStart={() => select("play")}
        onOpen={() => select("report")}
      />
    );
  return (
    <Screen scroll={false}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: space[4], gap: space[6] }}
      >
        <View style={{ gap: space[2] }}>
          <Text variant="caption" color="ink-secondary">
            DEVELOPMENT · SYNTHETIC DATA · NO NETWORK WRITES
          </Text>
          {params.controls !== "hide" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[3] }}>
              {["library", "play", "review", "waiting", "report"].map((value) => (
                <Button
                  key={value}
                  size="md"
                  variant={scene === value ? "accent" : "quiet"}
                  label={value}
                  onPress={() => select(value)}
                />
              ))}
            </View>
          ) : null}
        </View>
        {scene === "waiting" ? (
          <QuizWaiting session={session} partnerName={quizPeople.partner.name} />
        ) : scene === "report" ? (
          <QuizReport session={session} {...quizPeople} onDone={() => select("play")} />
        ) : (
          <QuizPlayContent
            key={scene}
            initialField={scene === "guess" ? "guess" : "choice"}
            session={session}
            {...quizPeople}
            onSave={save}
            onComplete={async () => select("waiting")}
            onStepChange={() => scroll.current?.scrollTo({ y: 0, animated: false })}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

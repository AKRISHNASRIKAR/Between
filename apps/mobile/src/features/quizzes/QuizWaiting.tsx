import type { QuizSession } from "@lovenotes/contracts";
import { View } from "react-native";
import { Dots, Pet, Text } from "@/design-system";

/** You're done; your partner isn't yet. Their progress, never their answers. */
export function QuizWaiting({ session, partnerName }: { session: QuizSession; partnerName: string }) {
  const total = session.questions.length;
  const done = session.partnerAnsweredCount;
  return (
    <View style={{ gap: 20, alignItems: "center", paddingTop: 24 }}>
      <Pet stage="baby" mood="content" size={160} />
      <Text variant="display-m" align="center">
        Waiting for {partnerName} 👀
      </Text>
      <View
        style={{ flexDirection: "row", gap: 6 }}
        accessibilityLabel={`${partnerName} has answered ${done} of ${total}`}
      >
        {session.questions.map((q, i) => (
          <View
            key={q.id}
            style={{ width: 22, height: 6, borderRadius: 3 }}
            className={i < done ? "bg-purple-base" : "bg-sunken"}
          />
        ))}
      </View>
      <Text variant="body" color="ink-secondary" align="center">
        {done === 0 ? `${partnerName} hasn't started yet.` : `${partnerName} is ${done}/${total} of the way.`} Your
        answers stay hidden until you're both done — we'll let you know.
      </Text>
      <Dots color="ink-tertiary" />
    </View>
  );
}

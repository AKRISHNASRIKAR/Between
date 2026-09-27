import { Redirect } from "expo-router";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { EmptyState, ErrorState, MoodCreature, Screen, Skeleton } from "@/design-system";
import { useDaily } from "@/features/quizzes/hooks";
import { useMe } from "@/features/space/hooks";

/** Push-notification target for today's question: resolves to its quiz session. */
export default function Daily() {
  const me = useMe();
  const daily = useDaily(me.data?.space?.id);
  if (daily.data) return <Redirect href={`/quiz/${daily.data.id}`} />;
  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 8 }}>
        <BackButton />
        {daily.isPending ? (
          <Skeleton height={300} radius="xl" />
        ) : daily.isError ? (
          <ErrorState onRetry={() => daily.refetch()} />
        ) : (
          <EmptyState
            illustration={<MoodCreature mood="calm" size={96} />}
            title="No question today"
            body="Come back tomorrow for a new one."
          />
        )}
      </View>
    </Screen>
  );
}

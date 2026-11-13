import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, ErrorState, Screen, Skeleton, Text, useToast } from "@/design-system";
import { PetDecision } from "@/features/pet/PetDecision";
import { useMe } from "@/features/space/hooks";
import { api, unwrap } from "@/lib/api";
import { humanError } from "@/lib/errors";

export default function PetChoice() {
  const me = useMe();
  const qc = useQueryClient();
  const toast = useToast();
  const spaceId = me.data?.space?.id;
  const finish = useMutation({
    mutationFn: () => {
      if (!spaceId) throw new Error("Your space is not ready yet. Try again.");
      return unwrap(api.spaces[":sid"].$patch({ param: { sid: spaceId }, json: { petSetupComplete: true } }));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      router.replace("/today");
    },
    onError: (e) => toast({ kind: "error", message: humanError(e) }),
  });
  if (!spaceId) {
    return (
      <Screen>
        {me.isError ? <ErrorState onRetry={() => me.refetch()} retrying={me.isFetching} /> : <Skeleton height={240} />}
      </Screen>
    );
  }
  return (
    <Screen>
      <View className="gap-8 pt-10">
        <Text variant="display-l">Your corner, your choice.</Text>
        <Text variant="body" color="ink-secondary">
          Notes, moods, questions and memories are ready for you both. You can also welcome a little pet, if you both
          agree.
        </Text>
        <PetDecision />
        <Button
          fullWidth
          variant="secondary"
          label="Continue without a pet"
          loading={finish.isPending}
          onPress={() => finish.mutate()}
        />
        <Text variant="caption" color="ink-tertiary">
          You can decide together later in Settings.
        </Text>
      </View>
    </Screen>
  );
}

import { View } from "react-native";
import { Button, Text, useToast } from "@/design-system";
import { useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";
import { usePetDecision } from "./hooks";

export function PetDecision() {
  const me = useMe();
  const pet = me.data?.space?.pet;
  const decision = usePetDecision(me.data?.space?.id);
  const toast = useToast();
  if (!pet) return null;
  const act = (input: Parameters<typeof decision.mutate>[0]) =>
    decision.mutate(input, {
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });
  const pending = pet.proposedEnabled !== null;
  const own = pet.decisionById === me.data?.profile.id;
  return (
    <View style={{ gap: 12, paddingVertical: 16 }}>
      <Text variant="heading">
        {pet.status === "ACTIVE"
          ? (pet.name ?? "Your shared pet")
          : pet.status === "PAUSED"
            ? "Your pet is resting"
            : "A pet, if you both want one"}
      </Text>
      <Text variant="body-sm" color="ink-secondary">
        Optional, and a decision for two. Pausing keeps your pet and its story safe.
      </Text>
      {pending ? (
        <>
          <Text variant="body-sm">
            {own ? "Waiting for your partner to agree" : "Your partner suggested"}{" "}
            {pet.proposedEnabled ? "having a pet together." : "taking a break from your pet."}
          </Text>
          <Text variant="caption" color="ink-secondary">
            {pet.status === "ACTIVE"
              ? "Your pet stays active until you both agree to pause."
              : "You can keep using Between while you decide together."}
          </Text>
          {!own ? (
            <Button
              label="Agree"
              loading={decision.isPending}
              disabled={!pet.decisionId}
              onPress={() => act({ action: "accept", decisionId: pet.decisionId ?? "" })}
            />
          ) : null}
          <Button
            variant="quiet"
            label={own ? "Withdraw suggestion" : "Keep things as they are"}
            loading={decision.isPending}
            disabled={!pet.decisionId}
            onPress={() => act({ action: "decline", decisionId: pet.decisionId ?? "" })}
          />
        </>
      ) : (
        <Button
          variant="secondary"
          label={
            pet.status === "ACTIVE"
              ? "Suggest pausing our pet"
              : pet.status === "PAUSED"
                ? "Suggest welcoming our pet back"
                : "Suggest a shared pet"
          }
          loading={decision.isPending}
          onPress={() => act({ action: "propose", enabled: pet.status !== "ACTIVE" })}
        />
      )}
    </View>
  );
}

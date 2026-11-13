import { useIsMutating } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Button, Screen, ShareFat, Text, useToast } from "@/design-system";
import { useCreateSpace, useMe } from "@/features/space/hooks";
import { JoinCard } from "@/features/space/JoinCard";
import { onboardingIntent } from "@/features/space/onboarding-intent";
import { PairingCard, PairingDivider } from "@/features/space/PairingCard";
import { pendingInvite } from "@/features/space/pending-invite";
import { humanError } from "@/lib/errors";

export default function Start() {
  const me = useMe();
  const create = useCreateSpace();
  const toast = useToast();
  const pairing = useIsMutating({ mutationKey: ["pairing"] }) > 0;
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    void Promise.all([onboardingIntent.take(), pendingInvite.get().catch(() => null)]).then(([intent, invite]) => {
      if (invite || intent === "join") router.push("/join");
      else if (intent === "create") router.push("/create");
    });
  }, []);
  return (
    <Screen>
      <View style={{ gap: 24, paddingTop: 28, paddingBottom: 16 }}>
        <View style={{ gap: 10 }}>
          <Text variant="label" color="action">
            A SPACE FOR TWO
          </Text>
          <Text variant="display-l">Pair with your person.</Text>
          <Text variant="body" color="ink-secondary">
            Little notes, new discoveries, and memories that belong to both of you.
          </Text>
        </View>
        <View>
          <PairingCard>
            <View style={{ gap: 6 }}>
              <Text variant="display-m">Invite your partner</Text>
              <Text variant="body-sm" color="ink-secondary">
                Make your shared space and get a private code to send them.
              </Text>
            </View>
            <Button
              fullWidth
              label="Create our invite"
              icon={ShareFat}
              loading={create.isPending}
              disabled={pairing}
              onPress={() =>
                create.mutate({}, { onError: (error) => toast({ kind: "error", message: humanError(error) }) })
              }
            />
          </PairingCard>
          <PairingDivider />
          <JoinCard disabled={pairing} />
        </View>
        {me.data?.retainedSpaces?.length ? (
          <Button variant="quiet" label="Read or export a closed space" onPress={() => router.push("/closed-spaces")} />
        ) : null}
      </View>
    </Screen>
  );
}

import type { Invite } from "@lovenotes/contracts";
import { useCallback, useEffect, useState } from "react";
import { Share, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Button,
  ConfirmModal,
  Dots,
  lift,
  Pet,
  palette,
  radius,
  Screen,
  ShareFat,
  Skeleton,
  Text,
  useToast,
} from "@/design-system";
import { useCreateInvite, useLeaveSpace, useMe } from "@/features/space/hooks";
import { inviteStore } from "@/features/space/invite-store";
import { humanError } from "@/lib/errors";
import { signOut } from "@/lib/session";

function daysLeft(iso: string) {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function Waiting() {
  const me = useMe();
  const space = me.data?.space;
  const toast = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const create = useCreateInvite(space?.id);
  const leave = useLeaveSpace(space?.id);

  const fresh = useCallback(() => {
    if (!space) return;
    create.mutate(undefined, {
      onSuccess: (inv) => {
        setInvite(inv);
        inviteStore.set(space.id, inv);
      },
    });
  }, [space, create.mutate]);

  useEffect(() => {
    if (!space || invite) return;
    inviteStore.get(space.id).then((saved) => (saved ? setInvite(saved) : fresh()));
  }, [space, invite, fresh]);

  const share = () => {
    if (!invite) return;
    Share.share({
      message: `Come join our little corner on Love Notes 💌\nOpen ${invite.url} or enter the code ${invite.code}`,
    }).catch(() => {});
  };

  return (
    <Screen
      footer={
        <>
          <Button fullWidth label="Send the invite" icon={ShareFat} disabled={!invite} onPress={share} />
          <Button fullWidth variant="quiet" label="Cancel this space" onPress={() => setConfirmCancel(true)} />
        </>
      }
    >
      <View className="gap-8 pt-10">
        <View className="items-center gap-2">
          <Pet stage="egg" mood="content" size={200} />
          <View className="flex-row items-center gap-2">
            <Dots color="ink-tertiary" />
            <Text variant="caption" color="ink-tertiary">
              waiting for your person
            </Text>
          </View>
        </View>
        <View className="gap-3">
          <Text variant="display-l">It hatches when you're both here.</Text>
          <Text variant="body" color="ink-secondary">
            Send this code to your person. When they join, your egg hatches on both phones.
          </Text>
        </View>

        <View
          style={{ backgroundColor: palette["butter-soft"], borderRadius: radius.lg, padding: 20, gap: 8, ...lift[1] }}
        >
          <Text variant="label" color="butter-deep">
            Your invite code
          </Text>
          {invite ? (
            <Animated.View entering={FadeIn}>
              <Text
                variant="display-xl"
                style={{ letterSpacing: 2 }}
                accessibilityLabel={`Invite code ${invite.code.split("").join(" ")}`}
              >
                {invite.code}
              </Text>
              <Text variant="caption" color="ink-secondary">
                Works for {daysLeft(invite.expiresAt)} more days · one use
              </Text>
            </Animated.View>
          ) : create.error ? (
            <View className="gap-2">
              <Text variant="body-sm" color="coral-deep">
                {humanError(create.error)}
              </Text>
              <Button variant="secondary" size="md" label="Try again" onPress={fresh} />
            </View>
          ) : (
            <View className="gap-2">
              <Skeleton height={50} width="80%" radius="sm" />
              <Skeleton height={16} width="50%" radius="sm" />
            </View>
          )}
          {invite ? (
            <View className="items-start pt-1">
              <Button
                variant="quiet"
                label="Make a new code"
                loading={create.isPending}
                onPress={() => {
                  fresh();
                  toast({ message: "New code made. The old one won't work anymore." });
                }}
              />
            </View>
          ) : null}
        </View>
        <View className="items-center">
          <Button variant="quiet" label="Sign out" onPress={signOut} />
        </View>
      </View>
      <ConfirmModal
        open={confirmCancel}
        title="Cancel this space?"
        body="Your egg and invite code will be removed. You can start fresh or join someone else's space afterwards."
        confirmLabel="Cancel space"
        destructive
        loading={leave.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => leave.mutate(undefined, { onSettled: () => setConfirmCancel(false) })}
      />
    </Screen>
  );
}

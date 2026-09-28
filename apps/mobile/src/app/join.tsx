import { LIMITS } from "@lovenotes/contracts";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { BackButton } from "@/components/BackButton";
import { Avatar, Button, CodeField, Dots, enter, lift, palette, radius, Screen, Text } from "@/design-system";
import { useAcceptInvite, useInvitePreview } from "@/features/space/hooks";
import { pendingInvite } from "@/features/space/pending-invite";
import { humanError } from "@/lib/errors";

export default function Join() {
  const [code, setCode] = useState("");
  const complete = code.length === LIMITS.inviteCodeLength;
  const preview = useInvitePreview(complete ? code : null);
  const accept = useAcceptInvite();

  useEffect(() => {
    pendingInvite.get().then((c) => {
      if (c)
        setCode(
          c
            .replace(/[^0-9A-Z]/gi, "")
            .toUpperCase()
            .slice(0, LIMITS.inviteCodeLength),
        );
    });
  }, []);

  const error = complete && preview.error ? humanError(preview.error) : accept.error ? humanError(accept.error) : null;

  return (
    <Screen
      footer={
        preview.data ? (
          <Button
            fullWidth
            label={`Join ${preview.data.inviter.displayName}`}
            loading={accept.isPending}
            onPress={() => accept.mutate(code, { onSuccess: () => pendingInvite.clear() })}
          />
        ) : null
      }
    >
      <View className="gap-8 pt-2">
        <BackButton />
        <View className="gap-3">
          <Text variant="display-l">Enter your invite code</Text>
          <Text variant="body" color="ink-secondary">
            It's 8 characters, like MOCH-7K2P.
          </Text>
        </View>
        <CodeField
          label="Invite code"
          length={LIMITS.inviteCodeLength}
          groupAt={4}
          value={code}
          onChange={(v) => {
            setCode(v);
            accept.reset();
          }}
          error={error}
          autoFocus
        />
        {complete && preview.isFetching ? (
          <View className="items-center py-4">
            <Dots />
          </View>
        ) : null}
        {preview.data ? (
          <Animated.View
            entering={enter()}
            style={{ backgroundColor: palette.paper, borderRadius: radius.lg, padding: 20, gap: 12, ...lift[1] }}
          >
            <View className="flex-row items-center gap-3">
              <Avatar name={preview.data.inviter.displayName} uri={preview.data.inviter.avatarUrl} who="partner" />
              <View className="flex-1">
                <Text variant="heading">{preview.data.inviter.displayName} invited you</Text>
                <Text variant="body-sm" color="ink-secondary">
                  to “{preview.data.spaceName}”
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

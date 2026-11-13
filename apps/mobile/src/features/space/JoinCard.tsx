import { LIMITS } from "@lovenotes/contracts";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Avatar, Button, CodeField, Text } from "@/design-system";
import { humanError } from "@/lib/errors";
import { useAcceptInvite, useInvitePreview } from "./hooks";
import { PairingCard } from "./PairingCard";
import { pendingInvite } from "./pending-invite";

export function JoinCard({ disabled = false }: { disabled?: boolean }) {
  const [code, setCode] = useState("");
  const complete = code.length === LIMITS.inviteCodeLength;
  const preview = useInvitePreview(complete ? code : null);
  const accept = useAcceptInvite();
  useEffect(() => {
    let active = true;
    pendingInvite.get().then((saved) => {
      if (active && saved)
        setCode(
          saved
            .replace(/[^0-9A-Z]/gi, "")
            .toUpperCase()
            .slice(0, LIMITS.inviteCodeLength),
        );
    });
    return () => {
      active = false;
    };
  }, []);
  const error = complete && preview.error ? humanError(preview.error) : accept.error ? humanError(accept.error) : null;
  return (
    <PairingCard tone="pink">
      <View style={{ gap: 6 }}>
        <Text variant="display-m">Have their code?</Text>
        <Text variant="body-sm" color="ink-secondary">
          Enter the invite your partner sent you.
        </Text>
      </View>
      <CodeField
        label="Partner’s code"
        length={LIMITS.inviteCodeLength}
        groupAt={4}
        value={code}
        editable={!disabled && !accept.isPending}
        onChange={(value) => {
          setCode(value);
          accept.reset();
        }}
        error={error}
      />
      {preview.data ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={preview.data.inviter.displayName} uri={preview.data.inviter.avatarUrl} who="partner" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{preview.data.inviter.displayName}</Text>
            <Text variant="body-sm" color="ink-secondary">
              Invited you to {preview.data.spaceName}
            </Text>
          </View>
        </View>
      ) : null}
      <Button
        fullWidth
        variant="secondary"
        label={preview.data ? `Pair with ${preview.data.inviter.displayName}` : "Pair with my partner"}
        disabled={disabled || !preview.data || preview.isFetching}
        loading={accept.isPending || (complete && preview.isFetching)}
        onPress={() => accept.mutate(code, { onSuccess: () => pendingInvite.clear() })}
      />
      <Text variant="caption" color="ink-secondary">
        Only the two of you can join this space.
      </Text>
    </PairingCard>
  );
}

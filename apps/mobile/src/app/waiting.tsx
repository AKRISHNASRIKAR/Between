import type { Invite } from "@lovenotes/contracts";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Share, View } from "react-native";
import {
  Button,
  ConfirmModal,
  CopySimple,
  Dots,
  palette,
  radius,
  Screen,
  ShareFat,
  Skeleton,
  Text,
  useToast,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useCreateDevPartner } from "@/features/dev/hooks";
import { useCreateInvite, useLeaveSpace, useMe } from "@/features/space/hooks";
import { inviteStore } from "@/features/space/invite-store";
import { PairingCard } from "@/features/space/PairingCard";
import { humanError } from "@/lib/errors";
import { signOut } from "@/lib/session";

export default function Waiting() {
  useThemeSubscription();
  const me = useMe();
  const space = me.data?.space;
  const toast = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const create = useCreateInvite(space?.id);
  const leave = useLeaveSpace(space?.id);
  const devPartner = useCreateDevPartner();
  const initialized = useRef<string | null>(null);

  const fresh = useCallback(
    (notify = false) => {
      if (!space || create.isPending) return;
      create.mutate(undefined, {
        onSuccess: (value) => {
          setInvite(value);
          void inviteStore.set(space.id, value).catch(() => {});
          setConfirmRefresh(false);
          if (notify) toast({ message: "New code ready. Your previous code no longer works." });
        },
        onError: (error) => toast({ kind: "error", message: humanError(error) }),
      });
    },
    [space, create.isPending, create.mutate, toast],
  );
  useEffect(() => {
    if (!space || initialized.current === space.id) return;
    initialized.current = space.id;
    inviteStore
      .get(space.id)
      .then((saved) => (saved ? setInvite(saved) : fresh()))
      .catch(() => fresh());
  }, [space, fresh]);

  const share = async () => {
    if (!invite || create.isPending) return;
    try {
      await Share.share({ message: `Join me on Between 💌\n${invite.url}\nOur invite code: ${invite.code}` });
    } catch (error) {
      toast({ kind: "error", message: humanError(error) });
    }
  };
  const copy = async () => {
    if (!invite || create.isPending) return;
    try {
      await Clipboard.setStringAsync(invite.code);
      setCopiedCode(invite.code);
      toast({ kind: "success", message: "Invite code copied" });
    } catch {
      toast({ kind: "error", message: "Couldn't copy the code. Try sharing the invite instead." });
    }
  };
  const characters = invite?.code.replace(/[^0-9A-Z]/gi, "").split("") ?? [];

  return (
    <Screen>
      <View style={{ gap: 24, paddingTop: 28, paddingBottom: 16 }}>
        <View style={{ gap: 10 }}>
          <Text variant="label" color="purple-deep">
            A SPACE FOR TWO
          </Text>
          <Text variant="display-l">Pair with your person.</Text>
          <Text variant="body" color="ink-secondary">
            Send them your invite. Your little corner is ready when they join.
          </Text>
        </View>
        <PairingCard>
          <Text variant="display-m">Invite your partner</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <Text variant="label" color="ink-secondary">
              Your private code
            </Text>
            <Button
              size="md"
              variant="quiet"
              icon={CopySimple}
              label={invite && copiedCode === invite.code ? "Copied" : "Copy code"}
              disabled={!invite || create.isPending}
              onPress={copy}
            />
          </View>
          {invite ? (
            <View
              accessible
              accessibilityLabel={`Invite code ${characters.join(" ")}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              {characters.map((character, index) => (
                <View
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional code cells
                  key={index}
                  style={{
                    flex: 1,
                    minHeight: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: palette.paper,
                    borderRadius: radius.sm,
                    marginLeft: index === 4 ? 6 : 0,
                  }}
                >
                  <Text variant="heading">{character}</Text>
                </View>
              ))}
            </View>
          ) : create.error ? (
            <View style={{ gap: 8 }}>
              <Text variant="body-sm" color="tomato-deep">
                {humanError(create.error)}
              </Text>
              <Button variant="secondary" label="Try again" onPress={() => fresh()} />
            </View>
          ) : (
            <Skeleton height={52} radius="sm" />
          )}
          <Button
            fullWidth
            icon={ShareFat}
            label="Share our invite"
            disabled={!invite || create.isPending}
            onPress={share}
          />
          {invite ? (
            <Text variant="caption" color="ink-secondary" align="center">
              One use · expires{" "}
              {new Date(invite.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          ) : null}
        </PairingCard>
        <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Dots color="purple-deep" />
            <Text variant="heading">Waiting for your partner</Text>
          </View>
          <Text variant="body-sm" color="ink-secondary" align="center">
            This page updates when they join. You can close the app and come back later.
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          <Button
            fullWidth
            variant="quiet"
            label="Make a new invite code"
            disabled={!invite}
            loading={create.isPending}
            onPress={() => setConfirmRefresh(true)}
          />
          <Button
            fullWidth
            variant="quiet"
            label="Already have your partner’s code?"
            onPress={() => setConfirmCancel(true)}
          />
          {me.data?.retainedSpaces?.length ? (
            <Button fullWidth variant="quiet" label="Closed spaces" onPress={() => router.push("/closed-spaces")} />
          ) : null}
          <Button fullWidth variant="quiet" label="Sign out" onPress={signOut} />
        </View>
        {__DEV__ ? (
          <Button
            fullWidth
            variant="secondary"
            label="Dev: simulate partner joining"
            loading={devPartner.isPending}
            onPress={() =>
              devPartner.mutate("Ananya", { onError: (error) => toast({ kind: "error", message: humanError(error) }) })
            }
          />
        ) : null}
      </View>
      <ConfirmModal
        open={confirmRefresh}
        title="Replace this invite?"
        body="Your current code and link will stop working. Share the new invite with your partner."
        confirmLabel="Make a new code"
        loading={create.isPending}
        onCancel={() => setConfirmRefresh(false)}
        onConfirm={() => fresh(true)}
      />
      <ConfirmModal
        open={confirmCancel}
        title="Use their invite instead?"
        body="This cancels your empty space and its invite. Then you can enter your partner’s code to join theirs."
        confirmLabel="Use their invite"
        loading={leave.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() =>
          leave.mutate(undefined, { onError: (error) => toast({ kind: "error", message: humanError(error) }) })
        }
      />
    </Screen>
  );
}

import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  Button,
  CaretRight,
  ConfirmModal,
  PressableScale,
  palette,
  radius,
  Screen,
  SignOut,
  Text,
  useToast,
} from "@/design-system";
import { partnerOf, useLeaveSpace, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";
import { signOut } from "@/lib/session";

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const body = (
    <View className="flex-row items-center justify-between py-4" style={{ minHeight: 56 }}>
      <Text variant="body">{label}</Text>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text variant="body" color="ink-tertiary" numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {onPress ? <CaretRight size={18} color={palette["ink-tertiary"]} weight="bold" /> : null}
      </View>
    </View>
  );
  return onPress ? (
    <PressableScale accessibilityLabel={label} onPress={onPress}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="label" color="ink-tertiary">
        {title}
      </Text>
      <View style={{ backgroundColor: palette.paper, borderRadius: radius.lg, paddingHorizontal: 20 }}>{children}</View>
    </View>
  );
}

export default function Settings() {
  const me = useMe();
  const space = me.data?.space;
  const partner = partnerOf(space, me.data?.profile.id);
  const leave = useLeaveSpace(space?.id);
  const toast = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <Screen>
      <View className="gap-8 pt-2">
        <BackButton />
        <Text variant="display-l">Settings</Text>
        <Section title="You">
          <Row label="Name" value={me.data?.profile.displayName ?? ""} />
          <Row label="Email" value={me.data?.profile.email ?? ""} />
        </Section>
        <Section title="Your space">
          <Row label="Space" value={space?.name} />
          <Row label="With" value={partner?.displayName} />
          <Row label="Pet" value={space?.pet.name ?? ""} />
        </Section>
        {__DEV__ ? (
          <Section title="Developer">
            <Row label="Simulated partner" onPress={() => router.push("/dev/partner")} />
            <Row label="Design system gallery" onPress={() => router.push("/dev/gallery")} />
          </Section>
        ) : null}
        <View className="gap-3">
          <Button fullWidth variant="secondary" icon={SignOut} label="Sign out" onPress={signOut} />
          <Button fullWidth variant="destructive" label="Leave this space" onPress={() => setConfirmLeave(true)} />
          <Text variant="caption" color="ink-tertiary" align="center">
            Leaving closes the space for both of you. You'll each have 30 days to read and export it, then it's deleted.
          </Text>
        </View>
      </View>
      <ConfirmModal
        open={confirmLeave}
        title="Leave this space?"
        body={`This closes your space with ${partner?.displayName ?? "your partner"} for both of you. It becomes read-only for 30 days, then everything is permanently deleted.`}
        confirmLabel="Leave and close space"
        destructive
        loading={leave.isPending}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() =>
          leave.mutate(undefined, {
            onSuccess: () => setConfirmLeave(false),
            onError: (e) => {
              setConfirmLeave(false);
              toast({ kind: "error", message: humanError(e) });
            },
          })
        }
      />
    </Screen>
  );
}

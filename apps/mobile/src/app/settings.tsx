import type { NotificationPrefs } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  Button,
  CaretRight,
  Chip,
  ConfirmModal,
  PressableScale,
  palette,
  radius,
  Screen,
  SignOut,
  Skeleton,
  Text,
  useToast,
} from "@/design-system";
import { useDeleteAccount, useExport, useNotificationPrefs, useUpdatePrefs } from "@/features/settings/hooks";
import { ToggleRow } from "@/features/settings/ToggleRow";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prefs = useNotificationPrefs();
  const updatePrefs = useUpdatePrefs();
  const exportData = useExport(space?.id);
  const deleteAccount = useDeleteAccount();
  const p = prefs.data;
  const setPref = (patch: Partial<NotificationPrefs>) =>
    updatePrefs.mutate(patch, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
  const quiet = p?.quietStart && p.quietEnd ? `${p.quietStart}-${p.quietEnd}` : "off";

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
        <Section title="Notifications">
          {p ? (
            <>
              <ToggleRow
                label="Notes"
                hint="When a note is waiting for you"
                value={p.notes}
                onChange={(v) => setPref({ notes: v })}
              />
              <ToggleRow label="Shared vibes" value={p.vibes} onChange={(v) => setPref({ vibes: v })} />
              <ToggleRow
                label="Quizzes"
                hint="Your turn, and reveals"
                value={p.quizzes}
                onChange={(v) => setPref({ quizzes: v })}
              />
              <ToggleRow label="Journal & photos" value={p.journal} onChange={(v) => setPref({ journal: v })} />
              <ToggleRow
                label="Our future"
                hint="When something gets stamped"
                value={p.future}
                onChange={(v) => setPref({ future: v })}
              />
              <View style={{ paddingVertical: 12, gap: 10 }}>
                <Text variant="body">Quiet hours</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(
                    [
                      ["off", "Off", null, null],
                      ["22:00-08:00", "10pm–8am", "22:00", "08:00"],
                      ["23:00-07:00", "11pm–7am", "23:00", "07:00"],
                    ] as const
                  ).map(([key, label, start, end]) => (
                    <Chip
                      key={key}
                      label={label}
                      family="sky"
                      selected={quiet === key}
                      onPress={() => setPref({ quietStart: start, quietEnd: end })}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : prefs.isError ? (
            <Text variant="body-sm" color="coral-deep" style={{ paddingVertical: 16 }}>
              {humanError(prefs.error)}
            </Text>
          ) : (
            <View style={{ paddingVertical: 16 }}>
              <Skeleton height={20} width="60%" radius="sm" />
            </View>
          )}
        </Section>
        <Section title="Your data">
          <Row
            label={exportData.isPending ? "Preparing export…" : "Export everything"}
            onPress={() =>
              exportData.mutate(undefined, { onError: (e) => toast({ kind: "error", message: humanError(e) }) })
            }
          />
          <Row label="Delete my account" onPress={() => setConfirmDelete(true)} />
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
        open={confirmDelete}
        title="Delete your account?"
        body={`Your notes, journal entries, moods and photos are deleted now. Your space with ${partner?.displayName ?? "your partner"} closes: they keep read-only access to their own things for 30 days. This can't be undone.`}
        confirmLabel="Delete my account"
        destructive
        loading={deleteAccount.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onError: (e) => {
              setConfirmDelete(false);
              toast({ kind: "error", message: humanError(e) });
            },
          })
        }
      />
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

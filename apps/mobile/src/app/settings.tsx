import type { NotificationPrefs } from "@lovenotes/contracts";
import Constants from "expo-constants";
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
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { PetDecision } from "@/features/pet/PetDecision";
import { PetNamingSettings } from "@/features/pet/PetNamingSettings";
import { AppearancePicker } from "@/features/settings/AppearancePicker";
import {
  useDeleteAccount,
  useExport,
  useNotificationPrefs,
  useSignOut,
  useUpdatePrefs,
} from "@/features/settings/hooks";
import { ToggleRow } from "@/features/settings/ToggleRow";
import { partnerOf, useLeaveSpace, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";
import { setPreferences, usePreferences } from "@/lib/preferences";

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  useThemeSubscription();
  const body = (
    <View className="flex-row items-center justify-between py-4" style={{ minHeight: 56 }}>
      <Text variant="body" style={{ flexShrink: 1 }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2" style={{ flexShrink: 1, maxWidth: "70%" }}>
        {value ? (
          <Text variant="body" color="ink-secondary" style={{ flexShrink: 1 }}>
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
  useThemeSubscription();
  return (
    <View className="gap-2">
      <Text variant="label" color="action">
        {title}
      </Text>
      <View
        style={{
          backgroundColor: palette.paper,
          borderWidth: 1,
          borderColor: palette.line,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          paddingHorizontal: 20,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function Settings() {
  useThemeSubscription();
  const personal = usePreferences();
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
  const logout = useSignOut();
  const p = prefs.data;
  const setPref = (patch: Partial<NotificationPrefs>) =>
    updatePrefs.mutate(patch, { onError: (e) => toast({ kind: "error", message: humanError(e) }) });
  const quiet = p?.quietStart && p.quietEnd ? `${p.quietStart}-${p.quietEnd}` : "off";

  return (
    <Screen>
      <View className="gap-8 pt-2">
        <BackButton />
        <View style={{ gap: 8 }}>
          <Text variant="display-l">Settings</Text>
          <Text variant="body" color="ink-secondary">
            Make this little space feel like yours.
          </Text>
        </View>
        <Section title="You">
          <Row label="Name" value={me.data?.profile.displayName ?? ""} />
          <Row label="Email" value={me.data?.profile.email ?? ""} />
        </Section>
        <Section title="Your space">
          <Row label="Space" value={space?.name} />
          <Row label="With" value={partner?.displayName} />
        </Section>
        <Section title="Shared pet">
          <PetDecision />
          <PetNamingSettings />
        </Section>
        <Section title="Appearance">
          <AppearancePicker />
        </Section>
        <Section title="Touch & motion">
          <ToggleRow label="Haptics" value={personal.haptics} onChange={(haptics) => setPreferences({ haptics })} />
          <ToggleRow
            label="Reduce motion"
            hint="Your phone's reduced motion setting is always respected"
            value={personal.reducedMotion}
            onChange={(reducedMotion) => setPreferences({ reducedMotion })}
          />
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
              {space?.pet.status === "ACTIVE" ? (
                <ToggleRow
                  label="Pet updates"
                  hint={`Good news from ${space?.pet.name ?? "your pet"} — at most one a day`}
                  value={p.petUpdates}
                  onChange={(v) => setPref({ petUpdates: v })}
                />
              ) : null}
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
            <View style={{ paddingVertical: 16, gap: 12 }}>
              <Text variant="body-sm" color="tomato-deep">
                {humanError(prefs.error)}
              </Text>
              <Button
                variant="quiet"
                label="Retry notifications"
                loading={prefs.isFetching}
                onPress={() => prefs.refetch()}
              />
            </View>
          ) : (
            <View style={{ paddingVertical: 16 }}>
              <Skeleton height={20} width="60%" radius="sm" />
            </View>
          )}
        </Section>
        <Section title="Your data">
          {me.data?.retainedSpaces?.length ? (
            <Row label="Closed spaces" onPress={() => router.push("/closed-spaces")} />
          ) : null}
          <Row
            label={exportData.isPending ? "Preparing export…" : "Export our space"}
            onPress={() =>
              exportData.mutate(undefined, { onError: (e) => toast({ kind: "error", message: humanError(e) }) })
            }
          />
          <Row label="Delete my account" onPress={() => setConfirmDelete(true)} />
        </Section>
        <Section title="About">
          <Row label="Between" value={Constants.expoConfig?.version ?? "Development"} />
        </Section>
        {__DEV__ ? (
          <Section title="Developer">
            <Row label="Preview introduction" onPress={() => router.push("/dev/onboarding")} />
            <Row label="Mock couple scenarios" onPress={() => router.push("/dev/testing")} />
            <Row label="Simulated partner" onPress={() => router.push("/dev/partner")} />
            <Row label="Quiz playground" onPress={() => router.push("/dev/quizzes")} />
            <Row label="Design system gallery" onPress={() => router.push("/dev/gallery")} />
          </Section>
        ) : null}
        <View className="gap-3">
          <Button
            fullWidth
            variant="secondary"
            icon={SignOut}
            label="Sign out"
            loading={logout.isPending}
            onPress={() => logout.mutate()}
          />
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

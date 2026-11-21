import type { NotificationPrefs } from "@lovenotes/contracts";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Children, type ComponentType, Fragment, isValidElement, useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  Avatar,
  Bell,
  BookOpenText,
  Brain,
  Button,
  CaretRight,
  Chip,
  ConfirmModal,
  DownloadSimple,
  Envelope,
  type Family,
  family,
  Gear,
  HandHeart,
  House,
  type IconProps,
  LockSimple,
  Moon,
  PawPrint,
  PressableScale,
  palette,
  radius,
  Screen,
  SignOut,
  Skeleton,
  Sparkle,
  SunHorizon,
  Text,
  Ticket,
  Trash,
  Users,
  useToast,
  X,
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

type IconComp = ComponentType<IconProps>;

/** A rounded tile in a pillar colour (Settings · Inset groups, design decision 2026-11-21). */
function IconTile({ icon: Icon, fam }: { icon: IconComp; fam: Family }) {
  useThemeSubscription();
  const f = family(fam);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: f.soft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={17} color={f.deep} weight="bold" />
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  icon,
  fam = "sky",
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  icon: IconComp;
  fam?: Family;
  danger?: boolean;
}) {
  useThemeSubscription();
  const body = (
    <View className="flex-row items-center gap-3 py-3" style={{ minHeight: 52 }}>
      <IconTile icon={icon} fam={danger ? "tomato" : fam} />
      <Text variant="body-sm-strong" color={danger ? "tomato-deep" : "ink"} style={{ flex: 1 }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2" style={{ flexShrink: 1, maxWidth: "60%" }}>
        {value ? (
          <Text variant="body-sm" color="ink-tertiary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {value}
          </Text>
        ) : null}
        {onPress ? <CaretRight size={16} color={palette["ink-tertiary"]} weight="bold" /> : null}
      </View>
    </View>
  );
  return onPress ? (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}

/** A titled inset group; hairlines start after the icon tile so rows read as one list. */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  useThemeSubscription();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className="gap-2">
      {title ? (
        <Text variant="label" color="ink-tertiary" style={{ paddingLeft: 4 }}>
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: palette.paper,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          paddingHorizontal: 16,
        }}
      >
        {rows.map((row, i) => (
          <Fragment key={(isValidElement(row) && row.key) || String(i)}>
            {i > 0 ? <View style={{ height: 1, backgroundColor: palette.line, marginLeft: 42 }} /> : null}
            {row}
          </Fragment>
        ))}
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
        <View style={{ alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row" }}>
            <Avatar size={64} name={me.data?.profile.displayName ?? null} uri={me.data?.profile.avatarUrl} who="you" />
            {partner ? (
              <View style={{ marginLeft: -16 }}>
                <Avatar size={64} name={partner.displayName} uri={partner.avatarUrl} who="partner" />
              </View>
            ) : null}
          </View>
          <Text variant="display-m" accessibilityRole="header" align="center">
            {partner
              ? `${me.data?.profile.displayName ?? "You"} & ${partner.displayName}`
              : (me.data?.profile.displayName ?? "Settings")}
          </Text>
          <Text variant="body-sm" color="ink-tertiary" align="center">
            {space?.name ? `${space.name} · settings` : "Make this little space feel like yours."}
          </Text>
        </View>
        <Section title="You">
          <Row icon={Users} label="Name" value={me.data?.profile.displayName ?? ""} />
          <Row icon={Envelope} label="Email" value={me.data?.profile.email ?? ""} />
        </Section>
        <Section title="Your space">
          <Row icon={House} fam="butter" label="Space" value={space?.name} />
          <Row icon={HandHeart} fam="pink" label="With" value={partner?.displayName} />
        </Section>
        <Section title="Shared pet">
          <PetDecision />
          <PetNamingSettings />
        </Section>
        <Section title="Appearance">
          <AppearancePicker />
        </Section>
        <Section title="Touch & motion">
          <ToggleRow
            leading={<IconTile icon={Sparkle} fam="purple" />}
            label="Haptics"
            value={personal.haptics}
            onChange={(haptics) => setPreferences({ haptics })}
          />
          <ToggleRow
            leading={<IconTile icon={Moon} fam="purple" />}
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
                leading={<IconTile icon={Envelope} fam="pink" />}
                label="Notes"
                hint="When a note is waiting for you"
                value={p.notes}
                onChange={(v) => setPref({ notes: v })}
              />
              <ToggleRow
                leading={<IconTile icon={SunHorizon} fam="sky" />}
                label="Shared vibes"
                value={p.vibes}
                onChange={(v) => setPref({ vibes: v })}
              />
              <ToggleRow
                leading={<IconTile icon={Brain} fam="purple" />}
                label="Quizzes"
                hint="Your turn, and reveals"
                value={p.quizzes}
                onChange={(v) => setPref({ quizzes: v })}
              />
              <ToggleRow
                leading={<IconTile icon={BookOpenText} fam="butter" />}
                label="Journal & photos"
                value={p.journal}
                onChange={(v) => setPref({ journal: v })}
              />
              <ToggleRow
                leading={<IconTile icon={Ticket} fam="green" />}
                label="Our future"
                hint="When something gets stamped"
                value={p.future}
                onChange={(v) => setPref({ future: v })}
              />
              {space?.pet.status === "ACTIVE" ? (
                <ToggleRow
                  leading={<IconTile icon={PawPrint} fam="orange" />}
                  label="Pet updates"
                  hint={`Good news from ${space?.pet.name ?? "your pet"} — at most one a day`}
                  value={p.petUpdates}
                  onChange={(v) => setPref({ petUpdates: v })}
                />
              ) : null}
              <View style={{ paddingVertical: 12, gap: 10 }}>
                <View className="flex-row items-center gap-3">
                  <IconTile icon={Bell} fam="sky" />
                  <Text variant="body-sm-strong">Quiet hours</Text>
                </View>
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
            <Row icon={LockSimple} fam="purple" label="Closed spaces" onPress={() => router.push("/closed-spaces")} />
          ) : null}
          <Row
            icon={DownloadSimple}
            fam="teal"
            label={exportData.isPending ? "Preparing export…" : "Export our space"}
            onPress={() =>
              exportData.mutate(undefined, { onError: (e) => toast({ kind: "error", message: humanError(e) }) })
            }
          />
          <Row icon={Trash} danger label="Delete my account" onPress={() => setConfirmDelete(true)} />
        </Section>
        <Section title="About">
          <Row icon={Sparkle} fam="butter" label="Between" value={Constants.expoConfig?.version ?? "Development"} />
        </Section>
        {__DEV__ ? (
          <Section title="Developer">
            <Row icon={Gear} label="Preview introduction" onPress={() => router.push("/dev/onboarding")} />
            <Row icon={Gear} label="Mock couple scenarios" onPress={() => router.push("/dev/testing")} />
            <Row icon={Gear} label="Simulated partner" onPress={() => router.push("/dev/partner")} />
            <Row icon={Gear} label="Quiz playground" onPress={() => router.push("/dev/quizzes")} />
            <Row icon={Gear} label="Design system gallery" onPress={() => router.push("/dev/gallery")} />
          </Section>
        ) : null}
        <View className="gap-3 pb-6">
          <Section>
            <Row
              icon={SignOut}
              fam="purple"
              label={logout.isPending ? "Signing out…" : "Sign out"}
              onPress={() => logout.mutate()}
            />
            <Row icon={X} danger label="Leave this space" onPress={() => setConfirmLeave(true)} />
          </Section>
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

import { Redirect, router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, ConfirmModal, palette, radius, Screen, space, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { createMockCouple } from "@/features/dev/mock-bootstrap";
import { allowsMockConnections, isMockEmail, type MockScenario } from "@/features/dev/mock-policy";
import { authClient } from "@/lib/auth";
import { API_URL } from "@/lib/config";

const scenarios: { id: MockScenario; title: string; body: string }[] = [
  {
    id: "empty",
    title: "A fresh connection",
    body: "Sam and Alex are paired, with no activity yet. Test first-use and empty states.",
  },
  {
    id: "active",
    title: "A little world in motion",
    body: "Notes from Alex, a shared feeling, a sample photo, plans and a quiz to answer.",
  },
  {
    id: "returning",
    title: "Coming back to your story",
    body: "More notes and dated journal history. Test a fuller space without changing the system clock.",
  },
];
export default function DeveloperTesting() {
  useThemeSubscription();
  const session = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MockScenario | null>(null);
  const running = useRef(false);
  if (!__DEV__) return <Redirect href="/" />;
  const available = allowsMockConnections(__DEV__, API_URL);
  const launch = async (scenario: MockScenario) => {
    if (running.current || !available) return;
    running.current = true;
    setBusy(true);
    setError(null);
    setConfirm(null);
    try {
      await createMockCouple(scenario, setStatus);
      router.replace("/today");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not prepare the sample space. Check the local API.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const choose = (scenario: MockScenario) => {
    if (session.data && !isMockEmail(session.data.user.email)) setConfirm(scenario);
    else void launch(scenario);
  };
  return (
    <Screen>
      <View style={{ gap: space[6], paddingVertical: space[4] }}>
        <BackButton />
        <View style={{ gap: space[3] }}>
          <Text variant="label" color="action">
            Developer testing
          </Text>
          <Text variant="display-l">A connection to play with.</Text>
          <Text variant="body" color="ink-secondary">
            Create a local sample couple and explore the real app. No second phone, real partner or photo permissions
            needed.
          </Text>
        </View>
        <Text variant="caption" color="ink-secondary">
          LOCAL API · {API_URL}
        </Text>
        {!available ? (
          <Text variant="body" color="tomato-deep">
            Use a development build connected to a localhost API. Mock connections are disabled for remote services and
            release builds.
          </Text>
        ) : null}
        {scenarios.map((scenario) => (
          <View
            key={scenario.id}
            style={{
              padding: space[5],
              gap: space[3],
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.paper,
            }}
          >
            <Text variant="heading">{scenario.title}</Text>
            <Text variant="body-sm" color="ink-secondary">
              {scenario.body}
            </Text>
            <Button
              variant="secondary"
              disabled={!available || busy || session.isPending}
              label={`Create ${scenario.id} mock couple`}
              onPress={() => choose(scenario.id)}
            />
          </View>
        ))}
        {busy ? (
          <Text variant="body-sm" color="action" accessibilityLiveRegion="polite">
            {status}
          </Text>
        ) : null}
        {error ? (
          <Text variant="body-sm" color="tomato-deep" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <Text variant="caption" color="ink-secondary">
          Each launch makes fresh synthetic accounts on your local backend. Existing spaces aren't deleted or reset.
          Sample photos and quiz behavior use the existing dev services; some generated artwork varies. Use Settings →
          Developer → Simulated partner for more actions.
        </Text>
      </View>
      <ConfirmModal
        open={!!confirm}
        title="Switch to a mock couple?"
        body="This signs you out of your current account on this phone and opens a fresh local test connection. Your existing account and space are not deleted."
        confirmLabel="Switch to local mock"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void launch(confirm);
        }}
      />
    </Screen>
  );
}

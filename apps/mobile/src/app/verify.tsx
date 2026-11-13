import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, CodeField, Screen, Text } from "@/design-system";
import { signInDraft } from "@/features/space/sign-in-draft";
import { authClient } from "@/lib/auth";

const RESEND_AFTER_S = 30;

export default function Verify() {
  const email = signInDraft.get();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_AFTER_S);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const requesting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (otp: string) => {
    if (otp.length !== 6 || requesting.current) return;
    requesting.current = true;
    setVerifying(true);
    setError(null);
    try {
      const { error: err } = await authClient.signIn.emailOtp({ email, otp });
      if (err) {
        setCode("");
        setError(
          err.status === 429
            ? "Too many tries. Wait a minute and try again."
            : "That code didn't work. Check it and try again.",
        );
        return;
      }
      await qc.invalidateQueries();
    } catch {
      setError("Couldn't verify your code. Check your connection and try again.");
    } finally {
      requesting.current = false;
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (requesting.current || cooldown > 0) return;
    requesting.current = true;
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (err) {
        setError(
          err.status === 429
            ? "Too many code requests. Wait a minute and try again."
            : "Couldn't request a new code. Check your connection and try again.",
        );
        return;
      }
      setCode("");
      setResent(true);
      setCooldown(RESEND_AFTER_S);
    } catch {
      setError("Couldn't request a new code. Check your connection and try again.");
    } finally {
      requesting.current = false;
      setResending(false);
    }
  };

  if (!email) return <Redirect href="/sign-in" />;

  return (
    <Screen
      footer={
        <Button
          fullWidth
          label="Continue"
          loading={verifying}
          disabled={code.length !== 6 || resending}
          onPress={() => verify(code)}
        />
      }
    >
      <View className="gap-8 pt-2">
        <BackButton />
        <View className="gap-3">
          <Text variant="display-l">Check your email</Text>
          <Text variant="body" color="ink-secondary">
            We sent a code to <Text variant="body">{email}</Text>
          </Text>
        </View>
        <CodeField
          label="6-digit code"
          length={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={verify}
          alphabet={/[0-9]/}
          keyboard="number-pad"
          error={error}
          autoFocus
        />
        {resent ? (
          <Text variant="body-sm" color="action" accessibilityLiveRegion="polite">
            A new code was requested. Check your email.
          </Text>
        ) : null}
        <View className="items-start">
          {cooldown > 0 ? (
            <Text variant="body-sm" color="ink-tertiary">
              You can ask for a new code in {cooldown}s
            </Text>
          ) : (
            <Button variant="quiet" label="Send a new code" loading={resending} onPress={resend} />
          )}
        </View>
      </View>
    </Screen>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (otp: string) => {
    if (otp.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    const { error: err } = await authClient.signIn.emailOtp({ email, otp });
    setVerifying(false);
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
  };

  const resend = async () => {
    setResending(true);
    await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setResending(false);
    setCooldown(RESEND_AFTER_S);
  };

  if (!email) return <Redirect href="/sign-in" />;

  return (
    <Screen
      footer={
        <Button
          fullWidth
          label="Continue"
          loading={verifying}
          disabled={code.length !== 6}
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

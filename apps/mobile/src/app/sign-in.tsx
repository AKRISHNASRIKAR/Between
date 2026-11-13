import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import { z } from "zod";
import { BackButton } from "@/components/BackButton";
import { Button, Screen, Text, TextField } from "@/design-system";
import { signInDraft } from "@/features/space/sign-in-draft";
import { authClient } from "@/lib/auth";
import { DEV_FIXED_OTP, DEV_SKIP_EMAIL_CODE } from "@/lib/dev";

const Email = z.email();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();
  const submitting = useRef(false);
  const [showCodeScreen, setShowCodeScreen] = useState(false);

  const submit = async () => {
    if (submitting.current) return;
    const parsed = Email.safeParse(email.trim().toLowerCase());
    if (!parsed.success) return setError("That doesn't look like an email address.");
    submitting.current = true;
    setError(null);
    setSending(true);
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email: parsed.data, type: "sign-in" });
      if (err) return setError("Couldn't send a code right now. Check your connection and try again.");
      if (DEV_SKIP_EMAIL_CODE && !showCodeScreen) {
        const { error: signInErr } = await authClient.signIn.emailOtp({ email: parsed.data, otp: DEV_FIXED_OTP });
        if (signInErr) return setError("Dev sign-in failed. Is DEV_FIXED_OTP=000000 set in apps/api/.env?");
        await qc.invalidateQueries();
        return;
      }
      signInDraft.set(parsed.data);
      router.push("/verify");
    } catch {
      setError("Couldn't connect. Your email is still here — check your connection and try again.");
    } finally {
      submitting.current = false;
      setSending(false);
    }
  };

  return (
    <Screen footer={<Button fullWidth label="Send me a code" loading={sending} onPress={submit} />}>
      <View className="gap-8 pt-2">
        <BackButton />
        <View className="gap-3">
          <Text variant="display-l">What's your email?</Text>
          <Text variant="body" color="ink-secondary">
            We'll send you a 6-digit code. No passwords to remember.
          </Text>
        </View>
        {__DEV__ ? (
          <Button
            variant="quiet"
            size="md"
            label={showCodeScreen ? "Dev: verification screen on" : "Dev: test the email-code screen"}
            disabled={sending}
            onPress={() => setShowCodeScreen((value) => !value)}
          />
        ) : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (error) setError(null);
          }}
          error={error}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
          returnKeyType="send"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}

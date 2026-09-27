import { LIMITS } from "@lovenotes/contracts";
import { useState } from "react";
import { View } from "react-native";
import { Button, Screen, Text, TextField } from "@/design-system";
import { useUpdateMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

export default function YourName() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateMe();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Add a name so your person knows it's you.");
    update.mutate(trimmed, { onError: (e) => setError(humanError(e)) });
  };

  return (
    <Screen footer={<Button fullWidth label="Continue" loading={update.isPending} onPress={submit} />}>
      <View className="gap-8 pt-12">
        <View className="gap-3">
          <Text variant="display-l">What should they call you?</Text>
          <Text variant="body" color="ink-secondary">
            Your first name, a nickname — whatever feels like you.
          </Text>
        </View>
        <TextField
          label="Your name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError(null);
          }}
          error={error}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          maxLength={LIMITS.displayName.max}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>
    </Screen>
  );
}

import { LIMITS } from "@lovenotes/contracts";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, Screen, Text, TextField } from "@/design-system";
import { WelcomeKeepsake } from "@/design-system/objects/WelcomeKeepsake";
import { useCreateSpace } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

export default function Create() {
  const [name, setName] = useState("");
  const create = useCreateSpace();
  return (
    <Screen
      footer={
        <Button
          fullWidth
          label="Create our space"
          loading={create.isPending}
          onPress={() => create.mutate({ name: name.trim() || undefined })}
        />
      }
    >
      <View className="gap-8 pt-2">
        <BackButton />
        <View className="items-center">
          <WelcomeKeepsake width={220} />
        </View>
        <View className="gap-3">
          <Text variant="display-l">Name your little corner</Text>
          <Text variant="body" color="ink-secondary">
            Optional. Give this little space a name that feels like you.
          </Text>
        </View>
        <TextField
          label="Space name"
          value={name}
          onChangeText={setName}
          placeholder="our little corner"
          maxLength={LIMITS.spaceName.max}
          error={create.error ? humanError(create.error) : null}
          returnKeyType="done"
        />
      </View>
    </Screen>
  );
}

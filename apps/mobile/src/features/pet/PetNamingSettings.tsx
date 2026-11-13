import { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextField, useToast } from "@/design-system";
import { useMe, usePetName } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

/** Names are shared proposals, not a personal profile preference. */
export function PetNamingSettings() {
  const me = useMe();
  const pet = me.data?.space?.pet;
  const naming = usePetName(me.data?.space?.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const toast = useToast();
  if (pet?.status !== "ACTIVE") return null;
  const save = (input: Parameters<typeof naming.mutate>[0]) =>
    naming.mutate(input, {
      onSuccess: () => {
        setEditing(false);
        setName("");
      },
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });
  return (
    <View className="gap-3 pb-4">
      <Text variant="caption" color="ink-tertiary">
        Species: Dog · shared by both of you
      </Text>
      {pet.proposedName ? (
        <>
          <Text variant="body-sm">
            {pet.proposedById === me.data?.profile.id ? "You suggested" : "Your partner suggested"} {pet.proposedName}.
          </Text>
          {pet.proposedById !== me.data?.profile.id ? (
            <Button
              variant="secondary"
              label={`Agree to ${pet.proposedName}`}
              loading={naming.isPending}
              onPress={() => save({ action: "accept", name: pet.proposedName ?? "" })}
            />
          ) : null}
        </>
      ) : null}
      {editing ? (
        <>
          <TextField
            label="Suggest a shared name"
            value={name}
            onChangeText={setName}
            maxLength={24}
            autoCapitalize="words"
          />
          <Button
            variant="secondary"
            label="Suggest this name"
            disabled={!name.trim()}
            loading={naming.isPending}
            onPress={() => save({ action: "propose", name })}
          />
          <Button variant="quiet" label="Cancel" disabled={naming.isPending} onPress={() => setEditing(false)} />
        </>
      ) : (
        <Button
          variant="quiet"
          label="Suggest a new name"
          onPress={() => {
            setName(pet.name ?? "");
            setEditing(true);
          }}
        />
      )}
    </View>
  );
}

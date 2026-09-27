import { LIMITS } from "@lovenotes/contracts";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, Screen, Text, TextField, useToast } from "@/design-system";
import { useCreatePage } from "@/features/journal/hooks";
import { PhotoTray, usePhotoUploads } from "@/features/journal/PhotoPicker";
import { useMe } from "@/features/space/hooks";
import { localDateString } from "@/lib/date";
import { humanError } from "@/lib/errors";

/** "Write about today": a new dated page with your first block (text and/or photos). */
export default function NewPage() {
  const me = useMe();
  const spaceId = me.data?.space?.id;
  const create = useCreatePage(spaceId);
  const uploads = usePhotoUploads(spaceId);
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const canSave = (!!body.trim() || uploads.mediaIds.length > 0) && !uploads.uploading;

  const save = () =>
    create.mutate(
      {
        pageDate: localDateString(),
        title: title.trim() || null,
        body: body.trim() || null,
        mediaIds: uploads.mediaIds,
      },
      {
        onSuccess: (p) => router.replace(`/journal/${p.id}`),
        onError: (e) => toast({ kind: "error", message: humanError(e) }),
      },
    );

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <Screen
      footer={
        <Button
          fullWidth
          label={uploads.uploading ? "Uploading photos…" : "Save to our journal"}
          loading={create.isPending}
          disabled={!canSave}
          onPress={save}
        />
      }
    >
      <View style={{ gap: 20, paddingTop: 8 }}>
        <BackButton label="Close" />
        <View style={{ gap: 4 }}>
          <Text variant="label" color="butter-deep">
            {today}
          </Text>
          <Text variant="display-m">What happened today?</Text>
        </View>
        <TextField
          label="Title (optional)"
          value={title}
          onChangeText={setTitle}
          placeholder="That café"
          maxLength={LIMITS.journalTitle.max}
        />
        <TextField
          label="Your side of the story"
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="We went to that café…"
          maxLength={LIMITS.journalBlockBody.max}
        />
        <PhotoTray uploads={uploads} />
      </View>
    </Screen>
  );
}

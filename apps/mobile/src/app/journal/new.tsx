import { LIMITS } from "@lovenotes/contracts";
import { router } from "expo-router";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Button, Screen, Text, TextField, useToast } from "@/design-system";
import { useCreatePage } from "@/features/journal/hooks";
import { PhotoTray, usePhotoUploads } from "@/features/journal/PhotoPicker";
import { useMe } from "@/features/space/hooks";
import { emptyJournal, rebaseJournalPhotos, validJournal } from "@/lib/composer-drafts";
import { pageAcknowledges } from "@/lib/draft-ack";
import { humanError } from "@/lib/errors";
import { useDraft } from "@/lib/use-draft";

/** "Write about today": a new dated page with your first block (text and/or photos). */
export default function NewPage() {
  const me = useMe();
  const spaceId = me.data?.space?.id;
  const create = useCreatePage(spaceId);
  const draft = useDraft(
    me.data?.profile.id && spaceId ? { userId: me.data.profile.id, spaceId, editor: "journal:new" } : null,
    emptyJournal,
    validJournal,
  );
  const uploads = usePhotoUploads(
    spaceId,
    draft.value.photos,
    (photos) => draft.update((old) => ({ ...old, photos })),
    me.data?.profile.id,
  );
  const toast = useToast();
  const { title, body } = draft.value;
  const setTitle = (title: string) => draft.update((old) => ({ ...old, title }));
  const setBody = (body: string) => draft.update((old) => ({ ...old, body }));
  const canSave = (!!body.trim() || uploads.mediaIds.length > 0) && !uploads.uploading && !uploads.hasFailures;

  const save = () => {
    const token = { id: draft.id, revision: draft.revision };
    const submitted = {
      id: draft.id,
      blockId: draft.id,
      pageDate: draft.value.pageDate,
      title: title.trim() || null,
      body: body.trim() || null,
      mediaIds: uploads.mediaIds,
    };
    create.mutate(submitted, {
      onSuccess: (p) => {
        if (!pageAcknowledges(p, submitted)) {
          draft.rebase(token, rebaseJournalPhotos);
          toast({
            kind: "error",
            message:
              "An earlier version is already saved. Newer writing is kept here. Retry retained photos before saving a new page.",
          });
          return;
        }
        if (!draft.acknowledge(token, rebaseJournalPhotos)) {
          toast({
            kind: "error",
            message: "The page is saved. Newer edits are kept here; retry any photos before saving them separately.",
          });
          return;
        }
        router.replace(`/journal/${p.id}`);
      },
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });
  };

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
          <Text variant="label" color="action">
            {today}
          </Text>
          <Text variant="display-m">What happened today?</Text>
        </View>
        <TextField
          label="Title (optional)"
          editable={!create.isPending}
          value={title}
          onChangeText={setTitle}
          placeholder="That café"
          maxLength={LIMITS.journalTitle.max}
        />
        <TextField
          label="Your side of the story"
          multiline
          editable={!create.isPending}
          value={body}
          onChangeText={setBody}
          placeholder="We went to that café…"
          maxLength={LIMITS.journalBlockBody.max}
        />
        <PhotoTray uploads={uploads} disabled={create.isPending} />
        <Text variant="caption" color={draft.savedLocally ? "ink-secondary" : "tomato-deep"}>
          {draft.savedLocally
            ? "Draft saved on this phone. Sharing needs a connection."
            : "Draft could not be saved locally. Keep this screen open."}
        </Text>
      </View>
    </Screen>
  );
}

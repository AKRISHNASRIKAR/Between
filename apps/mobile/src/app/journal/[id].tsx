import { LIMITS } from "@lovenotes/contracts";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, useWindowDimensions, View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  Button,
  ErrorState,
  haptics,
  identity,
  layout,
  PhotoFrame,
  PressableScale,
  palette,
  radius,
  Screen,
  Skeleton,
  Text,
  TextField,
  useToast,
} from "@/design-system";
import { useAddBlock, useDeleteBlock, useLovePage, usePage } from "@/features/journal/hooks";
import { PhotoTray, usePhotoUploads } from "@/features/journal/PhotoPicker";
import { partnerOf, useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

/** A shared journal page: each person's blocks, marked by identity color (DESIGN §7.3 JournalPage). */
export default function PageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const page = usePage(space?.id, id);
  const addBlock = useAddBlock(space?.id, id);
  const love = useLovePage(space?.id, id, myId);
  const del = useDeleteBlock(space?.id);
  const uploads = usePhotoUploads(space?.id);
  const toast = useToast();
  const [body, setBody] = useState("");
  const contentW = Math.min(width, layout.maxContentWidth + layout.gutter * 2) - layout.gutter * 2;

  if (page.isPending)
    return (
      <Screen>
        <View style={{ gap: 20, paddingTop: 8 }}>
          <BackButton />
          <Skeleton height={320} radius="paper" />
        </View>
      </Screen>
    );
  if (page.isError || !page.data)
    return (
      <Screen>
        <View style={{ gap: 20, paddingTop: 8 }}>
          <BackButton />
          <ErrorState title="This page isn't here" body="It may have been removed." onRetry={() => page.refetch()} />
        </View>
      </Screen>
    );

  const p = page.data;
  const loved = !!myId && p.lovedBy.includes(myId);
  const dateLabel = new Date(`${p.pageDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const post = () =>
    addBlock.mutate(
      { body: body.trim() || null, mediaIds: uploads.mediaIds },
      {
        onSuccess: () => {
          setBody("");
          uploads.reset();
        },
        onError: (e) => toast({ kind: "error", message: humanError(e) }),
      },
    );

  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 8, paddingBottom: 24 }}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <Text variant="label" color="butter-deep">
            {dateLabel}
          </Text>
          {p.title ? <Text variant="display-l">{p.title}</Text> : null}
        </View>

        <View style={{ backgroundColor: palette.paper, borderRadius: radius.paper, padding: 18, gap: 22 }}>
          {p.blocks.map((b, i) => {
            const mine = b.authorId === myId;
            const showAuthor = p.blocks[i - 1]?.authorId !== b.authorId;
            const content = (
              <View
                key={`${b.id}-content`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: mine ? identity.you : identity.partner,
                  paddingLeft: 12,
                  gap: 10,
                }}
              >
                {showAuthor ? (
                  <Text variant="caption" color="ink-tertiary">
                    {mine ? "You" : partner?.displayName}
                  </Text>
                ) : null}
                {b.body ? <Text variant="body">{b.body}</Text> : null}
                {b.media.length ? (
                  <View style={{ gap: 18, paddingTop: 6 }}>
                    {b.media.map((m) => (
                      <PhotoFrame
                        key={m.id}
                        id={m.id}
                        uri={m.url}
                        width={contentW - 36 - 16}
                        aspect={m.width / m.height}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
            // Only your own blocks respond to long-press (remove); others' are plain content.
            return mine ? (
              <PressableScale
                key={b.id}
                pressedScale={0.99}
                accessibilityLabel={`You: ${b.body ?? `${b.media.length} photos`}`}
                accessibilityHint="Long-press to remove"
                onLongPress={() =>
                  Alert.alert("Your part", undefined, [
                    { text: "Remove", style: "destructive", onPress: () => del.mutate(b.id) },
                    { text: "Cancel", style: "cancel" },
                  ])
                }
              >
                {content}
              </PressableScale>
            ) : (
              <View
                key={b.id}
                accessible
                accessibilityLabel={`${partner?.displayName}: ${b.body ?? `${b.media.length} photos`}`}
              >
                {content}
              </View>
            );
          })}
        </View>

        <View>
          <Button
            variant="accent"
            family="pink"
            label={loved ? "Loved ♥︎" : "Love this page"}
            onPress={() => {
              haptics.tick();
              love.mutate(!loved);
            }}
          />
        </View>

        <View style={{ gap: 12, paddingTop: 8 }}>
          <Text variant="label" color="ink-tertiary">
            Add your part
          </Text>
          <TextField
            label="Write something"
            multiline
            value={body}
            onChangeText={setBody}
            placeholder={
              p.blocks.some((b) => b.authorId !== myId)
                ? `Reply to ${partner?.displayName}'s side…`
                : "Add to this page…"
            }
            maxLength={LIMITS.journalBlockBody.max}
          />
          <PhotoTray uploads={uploads} />
          <Button
            label="Add to page"
            loading={addBlock.isPending}
            disabled={(!body.trim() && !uploads.mediaIds.length) || uploads.uploading}
            onPress={post}
          />
        </View>
      </View>
    </Screen>
  );
}

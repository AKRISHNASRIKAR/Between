import type { Media } from "@lovenotes/contracts";
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Dots, ImageSquare, PressableScale, palette, radius, Text, useToast, X } from "@/design-system";
import { humanError } from "@/lib/errors";
import { pickPhotos, uploadPhoto } from "@/lib/media-upload";

type Item = { key: string; localUri: string; media?: Media; failed?: boolean };

/** Pick → upload immediately (in parallel) → returns ready media ids via onChange. */
export function usePhotoUploads(spaceId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const toast = useToast();

  const add = async () => {
    if (!spaceId) return;
    const picked = await pickPhotos(10 - items.length);
    const fresh = picked.map((p, i) => ({ key: `${Date.now()}-${i}`, localUri: p.uri, photo: p }));
    setItems((cur) => [...cur, ...fresh.map(({ photo: _p, ...rest }) => rest)]);
    await Promise.all(
      fresh.map(async (f) => {
        try {
          const media = await uploadPhoto(spaceId, f.photo);
          setItems((cur) => cur.map((it) => (it.key === f.key ? { ...it, media } : it)));
        } catch (e) {
          setItems((cur) => cur.map((it) => (it.key === f.key ? { ...it, failed: true } : it)));
          toast({ kind: "error", message: humanError(e) });
        }
      }),
    );
  };

  const remove = (key: string) => setItems((cur) => cur.filter((i) => i.key !== key));
  const uploading = items.some((i) => !i.media && !i.failed);
  const mediaIds = items.flatMap((i) => (i.media ? [i.media.id] : []));
  return { items, add, remove, uploading, mediaIds, reset: () => setItems([]) };
}

export function PhotoTray({ uploads }: { uploads: ReturnType<typeof usePhotoUploads> }) {
  return (
    <View style={{ gap: 10 }}>
      {uploads.items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {uploads.items.map((it) => (
            <View key={it.key}>
              <Image
                source={{ uri: it.localUri }}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: radius.sm,
                  opacity: it.media ? 1 : 0.5,
                  backgroundColor: palette.sunken,
                }}
                contentFit="cover"
              />
              {!it.media && !it.failed ? (
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                  <Dots />
                </View>
              ) : null}
              {it.failed ? (
                <Text variant="caption" color="coral-deep" style={{ position: "absolute", bottom: 4, left: 6 }}>
                  failed
                </Text>
              ) : null}
              <PressableScale
                accessibilityLabel="Remove photo"
                onPress={() => uploads.remove(it.key)}
                hitSlop={8}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: palette.ink,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} color={palette["on-ink"]} weight="bold" />
              </PressableScale>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View>
        <Button variant="secondary" size="md" icon={ImageSquare} label="Add photos" onPress={uploads.add} />
      </View>
    </View>
  );
}

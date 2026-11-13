import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Dots, ImageSquare, PressableScale, palette, radius, Text, useToast, X } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import type { DraftPhoto } from "@/lib/composer-drafts";
import { humanError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { pickPhotos, uploadPhoto } from "@/lib/media-upload";

/** Ready upload IDs and interrupted picks are retained by the owning composer draft. */
export function usePhotoUploads(
  spaceId: string | undefined,
  persisted?: DraftPhoto[],
  onChange?: (items: DraftPhoto[]) => void,
  ownerId?: string,
) {
  const [local, setLocal] = useState<DraftPhoto[]>([]);
  const [selecting, setSelecting] = useState(false);
  const items = persisted ?? local;
  const owner = `${ownerId ?? "local"}:${spaceId ?? ""}`;
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  const current = useRef(items);
  current.current = items;
  const inFlight = useRef(new Set<string>());
  const picking = useRef(false);
  const toast = useToast();
  const change = useCallback(
    (update: (items: DraftPhoto[]) => DraftPhoto[]) => {
      if (activeOwner.current !== owner) return;
      const next = update(current.current);
      current.current = next;
      if (onChange) onChange(next);
      else setLocal(next);
    },
    [owner, onChange],
  );
  useEffect(() => {
    if (items.some((item) => !item.media && !item.failed && !inFlight.current.has(item.key))) {
      change((old) =>
        old.map((item) => (!item.media && !inFlight.current.has(item.key) ? { ...item, failed: true } : item)),
      );
    }
  }, [items, change]);
  const upload = async (item: DraftPhoto) => {
    if (!spaceId) return;
    try {
      const media = await uploadPhoto(
        spaceId,
        { uri: item.localUri, width: item.width, height: item.height },
        null,
        item.key,
      );
      change((old) => old.map((value) => (value.key === item.key ? { ...value, media, failed: false } : value)));
    } catch (error) {
      change((old) => old.map((value) => (value.key === item.key ? { ...value, failed: true } : value)));
      toast({ kind: "error", message: humanError(error) });
    } finally {
      inFlight.current.delete(item.key);
    }
  };
  const add = async () => {
    if (!spaceId || picking.current || current.current.length >= 10) return;
    picking.current = true;
    setSelecting(true);
    try {
      const picked = await pickPhotos(10 - current.current.length);
      const fresh: DraftPhoto[] = picked
        .slice(0, 10 - current.current.length)
        .map((photo) => ({ key: newId(), localUri: photo.uri, width: photo.width, height: photo.height }));
      for (const item of fresh) inFlight.current.add(item.key);
      change((old) => [...old, ...fresh]);
      for (let index = 0; index < fresh.length; index += 2)
        await Promise.all(fresh.slice(index, index + 2).map(upload));
    } catch (error) {
      toast({ kind: "error", message: humanError(error) });
    } finally {
      picking.current = false;
      setSelecting(false);
    }
  };
  const retry = async (key: string) => {
    const item = current.current.find((value) => value.key === key);
    if (!item || item.media || inFlight.current.has(key)) return;
    inFlight.current.add(key);
    change((old) => old.map((value) => (value.key === key ? { ...value, failed: false } : value)));
    await upload(item);
  };
  return {
    items,
    add,
    retry,
    selecting,
    remove: (key: string) => change((old) => old.filter((item) => item.key !== key)),
    uploading: items.some((item) => !item.media && !item.failed),
    hasFailures: items.some((item) => item.failed),
    mediaIds: items.flatMap((item) => (item.media ? [item.media.id] : [])),
    reset: () => change(() => []),
  };
}

export function PhotoTray({
  uploads,
  disabled = false,
}: {
  uploads: ReturnType<typeof usePhotoUploads>;
  disabled?: boolean;
}) {
  useThemeSubscription();
  return (
    <View style={{ gap: 12 }}>
      {uploads.items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {uploads.items.map((item) => (
            <View key={item.key} style={{ gap: 4, width: 84 }}>
              <View>
                <Image
                  source={{ uri: item.localUri }}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: radius.sm,
                    opacity: item.media ? 1 : 0.5,
                    backgroundColor: palette.sunken,
                  }}
                  contentFit="cover"
                />
                {!item.media && !item.failed ? (
                  <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                    <Dots />
                  </View>
                ) : null}
                <PressableScale
                  disabled={disabled}
                  accessibilityLabel="Remove photo"
                  onPress={() => uploads.remove(item.key)}
                  hitSlop={8}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 28,
                    height: 28,
                    borderRadius: radius.pill,
                    backgroundColor: palette.ink,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={12} color={palette["on-ink"]} weight="bold" />
                </PressableScale>
              </View>
              {item.failed ? (
                <Button
                  disabled={disabled}
                  variant="quiet"
                  label="Retry photo"
                  onPress={() => void uploads.retry(item.key)}
                />
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {uploads.hasFailures ? (
        <Text variant="caption" color="tomato-deep">
          Some photos didn't finish. Retry them, or remove them before saving. If a local photo is no longer available,
          choose it again.
        </Text>
      ) : null}
      <View>
        <Button
          disabled={disabled || uploads.selecting || uploads.items.length >= 10}
          variant="secondary"
          size="md"
          icon={ImageSquare}
          label={
            uploads.selecting
              ? "Adding photos…"
              : `Add photos${uploads.items.length ? ` · ${uploads.items.length}/10` : ""}`
          }
          onPress={() => void uploads.add()}
        />
      </View>
    </View>
  );
}

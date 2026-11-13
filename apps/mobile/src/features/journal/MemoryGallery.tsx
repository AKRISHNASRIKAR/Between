import type { Media } from "@lovenotes/contracts";
import { FlashList, useRecyclingState } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { type ReactElement, useRef, useState } from "react";
import { FlatList, Modal, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Button,
  Dots,
  ErrorState,
  PressableScale,
  palette,
  radius,
  Text,
  X,
} from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { useReducedMotion } from "@/lib/preferences";

const dateLabel = (media: Media) =>
  new Date(media.takenAt ?? media.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function MemoryTile({ media, onPress }: { media: Media; onPress: () => void }) {
  useThemeSubscription();
  const [failed, setFailed] = useRecyclingState(false, [media.id, media.thumbUrl]);
  const aspect = media.width > 0 && media.height > 0 ? media.width / media.height : 1;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${media.caption || "Shared photo"}, ${dateLabel(media)}`}
      accessibilityHint="Open full photo"
      style={{ margin: 4, marginBottom: 12, gap: 7 }}
    >
      <View
        style={{
          aspectRatio: Math.max(0.55, Math.min(1.8, aspect)),
          borderRadius: radius.lg,
          overflow: "hidden",
          backgroundColor: palette.sunken,
        }}
      >
        <Image
          source={{ uri: media.thumbUrl, cacheKey: `${media.id}-t` }}
          recyclingKey={media.id}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
        {failed ? (
          <View style={{ position: "absolute", inset: 0, justifyContent: "center", padding: 12 }}>
            <Text variant="caption" align="center">
              Tap to open photo
            </Text>
          </View>
        ) : null}
      </View>
      {media.caption ? (
        <Text variant="body-sm" numberOfLines={2}>
          {media.caption}
        </Text>
      ) : null}
      <Text variant="caption" color="ink-tertiary">
        {dateLabel(media)}
      </Text>
    </PressableScale>
  );
}

function FullPhoto({ media, width, height }: { media: Media; width: number; height: number }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <View style={{ width, height, paddingHorizontal: 12, justifyContent: "center" }}>
      {failed ? (
        <ErrorState
          title="Photo couldn't load"
          body="Check your connection and try again."
          onRetry={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        />
      ) : (
        <Image
          key={`${media.url}-${attempt}`}
          source={{ uri: media.url, cacheKey: media.id }}
          placeholder={{ uri: media.thumbUrl }}
          placeholderContentFit="contain"
          contentFit="contain"
          style={{ width: "100%", height: "100%", borderRadius: radius.lg }}
          accessibilityLabel={media.caption || "Shared memory photo"}
          accessibilityIgnoresInvertColors
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

function MemoryViewer({
  photos,
  selectedId,
  onSelect,
  onClose,
}: {
  photos: Media[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useThemeSubscription();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const list = useRef<FlatList<Media>>(null);
  const index = Math.max(
    0,
    photos.findIndex((photo) => photo.id === selectedId),
  );
  const current = photos[index];
  if (!current) return null;
  const imageHeight = Math.max(180, (height - insets.top - insets.bottom) * 0.6);
  const move = (next: number) => {
    const photo = photos[next];
    if (!photo) return;
    onSelect(photo.id);
    list.current?.scrollToIndex({ index: next, animated: !reduced });
  };
  return (
    <Modal visible animationType={reduced ? "none" : "fade"} onRequestClose={onClose}>
      <View
        accessibilityViewIsModal
        style={{
          flex: 1,
          backgroundColor: palette.canvas,
          paddingTop: insets.top,
          paddingBottom: Math.max(16, insets.bottom),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Button variant="quiet" size="md" icon={X} label="Close" onPress={onClose} />
          <Text variant="caption" color="ink-secondary" accessibilityLiveRegion="polite">
            {index + 1} of {photos.length}
          </Text>
        </View>
        <ScrollView>
          <FlatList
            key={width}
            ref={list}
            data={photos}
            keyExtractor={(photo) => photo.id}
            horizontal
            pagingEnabled
            style={{ height: imageHeight }}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            getItemLayout={(_, position) => ({ length: width, offset: position * width, index: position })}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={3}
            onMomentumScrollEnd={(event) => {
              const photo = photos[Math.round(event.nativeEvent.contentOffset.x / width)];
              if (photo) onSelect(photo.id);
            }}
            renderItem={({ item }) => <FullPhoto media={item} width={width} height={imageHeight} />}
          />
          <View style={{ gap: 12, paddingHorizontal: 24, paddingVertical: 20 }}>
            <Text variant="label" color="ink-tertiary">
              {dateLabel(current)}
            </Text>
            {current.caption ? (
              <Text variant="display-m">{current.caption}</Text>
            ) : (
              <Text variant="heading">A moment of ours</Text>
            )}
            {current.pageId ? (
              <Button
                fullWidth
                label="Read the story"
                onPress={() => {
                  onClose();
                  router.push(`/journal/${current.pageId}`);
                }}
              />
            ) : null}
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Button
            variant="quiet"
            icon={ArrowLeft}
            label="Previous"
            disabled={index === 0}
            onPress={() => move(index - 1)}
          />
          <Button
            variant="quiet"
            icon={ArrowRight}
            label="Next"
            disabled={index === photos.length - 1}
            onPress={() => move(index + 1)}
          />
        </View>
      </View>
    </Modal>
  );
}

type Props = {
  photos: Media[];
  header: ReactElement;
  empty: ReactElement;
  horizontalPadding: number;
  refreshing: boolean;
  loadingMore: boolean;
  moreError: boolean;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
};

export function MemoryGallery({
  photos,
  header,
  empty,
  horizontalPadding,
  refreshing,
  loadingMore,
  moreError,
  hasMore,
  refresh,
  loadMore,
}: Props) {
  useThemeSubscription();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId && photos.some((photo) => photo.id === selectedId) ? selectedId : null;
  return (
    <>
      <FlashList
        masonry
        numColumns={2}
        optimizeItemArrangement={false}
        data={photos}
        keyExtractor={(photo) => photo.id}
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, horizontalPadding - 4), paddingBottom: 24 }}
        ListHeaderComponent={<View style={{ paddingHorizontal: 4 }}>{header}</View>}
        ListEmptyComponent={<View style={{ paddingHorizontal: 4 }}>{empty}</View>}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMore && !loadingMore && !moreError) loadMore();
        }}
        ListFooterComponent={
          loadingMore ? (
            <Dots />
          ) : moreError ? (
            <Button fullWidth variant="quiet" label="Try loading more photos" onPress={loadMore} />
          ) : photos.length && !hasMore ? (
            <Text variant="caption" color="ink-tertiary" align="center" style={{ padding: 20 }}>
              All your moments, kept here.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <MemoryTile media={item} onPress={() => setSelectedId(item.id)} />}
      />
      {selected ? (
        <MemoryViewer
          photos={photos}
          selectedId={selected}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </>
  );
}

import { LIMITS } from "@lovenotes/contracts";
import { useEffect, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Button,
  Confetti,
  Dots,
  type EggHandle,
  enter,
  haptics,
  Pet,
  pop,
  Screen,
  space as spacing,
  Text,
  TextField,
} from "@/design-system";
import { partnerOf, useMe, usePetName } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";
import { kv } from "@/lib/kv";

type Phase = "egg" | "hatching" | "hatched";

/** The pairing payoff: the egg cracks on both phones, then you name the pet together. */
export default function Hatch() {
  const me = useMe();
  const space = me.data?.space;
  const myId = me.data?.profile.id;
  const partner = partnerOf(space, myId);
  const pet = space?.pet;
  const naming = usePetName(space?.id);
  const egg = useRef<EggHandle>(null);
  const { height } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [burst, setBurst] = useState(0);
  const [name, setName] = useState("");
  const [proposing, setProposing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seenKey = `hatch-seen:${space?.id}`;
  useEffect(() => {
    if (!space) return;
    kv.getItem(seenKey).then((v) => setPhase(v ? "hatched" : "egg"));
  }, [space, seenKey]);

  useEffect(() => {
    if (phase !== "egg") return;
    const t = setTimeout(() => {
      setPhase("hatching");
      egg.current?.hatch(() => {
        setPhase("hatched");
        setBurst((b) => b + 1);
        haptics.yay();
        kv.setItem(seenKey, "1");
      });
    }, 900);
    return () => clearTimeout(t);
  }, [phase, seenKey]);

  if (!space || !pet || phase === null) return null;

  const proposedByMe = pet.proposedName && pet.proposedById === myId;
  const proposedByPartner = pet.proposedName && pet.proposedById !== myId;
  const showField = !pet.proposedName || proposing;

  const propose = () => {
    const n = name.trim();
    if (!n) return setError("Give them a name first.");
    setError(null);
    naming.mutate(
      { action: "propose", name: n },
      { onSuccess: () => setProposing(false), onError: (e) => setError(humanError(e)) },
    );
  };

  const footer =
    phase !== "hatched" ? null : showField ? (
      <Button fullWidth label="Suggest this name" loading={naming.isPending} onPress={propose} />
    ) : proposedByPartner ? (
      <>
        <Button
          fullWidth
          label={`Yes, ${pet.proposedName} it is`}
          loading={naming.isPending}
          onPress={() =>
            naming.mutate(
              { action: "accept" },
              { onSuccess: () => haptics.yay(), onError: (e) => setError(humanError(e)) },
            )
          }
        />
        <Button fullWidth variant="quiet" label="Suggest another name" onPress={() => setProposing(true)} />
      </>
    ) : (
      <Button fullWidth variant="quiet" label="Suggest a different name" onPress={() => setProposing(true)} />
    );

  return (
    <View className="flex-1 bg-canvas">
      <Screen footer={footer}>
        <View className="flex-1 gap-8 pt-10">
          <View className="items-center" style={{ minHeight: 220 }}>
            {phase === "hatched" ? (
              <Animated.View entering={pop()}>
                <Pet stage="baby" mood="excited" size={220} />
              </Animated.View>
            ) : (
              <Pet stage="egg" mood="content" size={220} eggRef={egg} />
            )}
          </View>

          {phase === "hatched" ? (
            <Animated.View entering={enter(6)} style={{ gap: spacing[6] }}>
              <View className="gap-3">
                <Text variant="label" color="orange-deep">
                  You and {partner?.displayName ?? "your person"}
                </Text>
                <Text variant="display-l">
                  {proposedByPartner && !proposing
                    ? `${partner?.displayName} wants to call them…`
                    : "Someone new is here."}
                </Text>
              </View>

              {proposedByPartner && !proposing ? (
                <Animated.View entering={FadeIn}>
                  <Text variant="display-xl" color="orange-deep">
                    {pet.proposedName}
                  </Text>
                </Animated.View>
              ) : proposedByMe && !proposing ? (
                <View className="gap-3">
                  <Text variant="body" color="ink-secondary">
                    You suggested <Text variant="heading">{pet.proposedName}</Text>. Waiting for {partner?.displayName}{" "}
                    to agree.
                  </Text>
                  <Dots color="ink-tertiary" />
                </View>
              ) : (
                <>
                  <Text variant="body" color="ink-secondary">
                    Give them a name. {partner?.displayName} will need to agree — it's a decision for two.
                  </Text>
                  <TextField
                    label="Their name"
                    value={name}
                    onChangeText={(v) => {
                      setName(v);
                      if (error) setError(null);
                    }}
                    placeholder="Mochi"
                    maxLength={LIMITS.petName.max}
                    autoCapitalize="words"
                    error={error}
                    returnKeyType="done"
                    onSubmitEditing={propose}
                  />
                </>
              )}
              {error && !showField ? (
                <Text variant="caption" color="tomato-deep">
                  {error}
                </Text>
              ) : null}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} style={{ gap: spacing[3] }}>
              <Text variant="display-l">Something's happening…</Text>
              <Text variant="body" color="ink-secondary">
                {partner?.displayName ?? "Your person"} is here.
              </Text>
            </Animated.View>
          )}
        </View>
      </Screen>
      <Confetti burst={burst} height={height} />
    </View>
  );
}

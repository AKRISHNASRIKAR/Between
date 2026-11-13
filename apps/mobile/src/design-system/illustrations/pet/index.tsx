import type { PetMood, PetStage } from "@lovenotes/contracts";
import { useFocusEffect } from "expo-router";
import { type Ref, useCallback, useState } from "react";
import { AppState } from "react-native";
import { Egg, type EggHandle } from "./Egg";
import { Mochi, type PetReaction } from "./Mochi";

export type { EggHandle, PetReaction };

type Props = {
  stage: PetStage;
  mood: PetMood;
  size?: number;
  reaction?: PetReaction | null;
  stroking?: boolean;
  eggRef?: Ref<EggHandle>;
};

/**
 * The swappable pet renderer. Features only ever use this component — the placeholder SVG art
 * can be replaced (Rive, illustrator art) without touching feature code. See SPEC D8.
 */
export function usePetActive() {
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setForeground(AppState.currentState === "active");
      const subscription = AppState.addEventListener("change", (state) => setForeground(state === "active"));
      return () => {
        setFocused(false);
        subscription.remove();
      };
    }, []),
  );
  return focused && foreground;
}

export function Pet({ stage, mood, size = 200, reaction, stroking, eggRef }: Props) {
  const active = usePetActive();
  if (stage === "egg") return <Egg size={size} ref={eggRef} active={active} />;
  return <Mochi mood={mood} size={size} reaction={reaction} stroking={stroking} active={active} />;
}

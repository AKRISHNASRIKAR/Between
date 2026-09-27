import type { PetMood, PetStage } from "@lovenotes/contracts";
import type { Ref } from "react";
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
export function Pet({ stage, mood, size = 200, reaction, stroking, eggRef }: Props) {
  if (stage === "egg") return <Egg size={size} ref={eggRef} />;
  return <Mochi mood={mood} size={size} reaction={reaction} stroking={stroking} />;
}

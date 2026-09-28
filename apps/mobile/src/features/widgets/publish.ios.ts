import type { WidgetSnapshot } from "@lovenotes/contracts";
import { Asset } from "expo-asset";
import { Directory, File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";
import UsWidget from "./ios/UsWidget";
import { type PetArt, petArtFor, toUsWidgetProps } from "./props";

const ART: Record<PetArt, number> = {
  awake: require("../../../assets/widget/pet-awake.png"),
  sleepy: require("../../../assets/widget/pet-sleepy.png"),
  egg: require("../../../assets/widget/pet-egg.png"),
};

/**
 * The widget extension can only read files in the shared App Group directory, so the pet
 * pictures are copied there once (they're bundled with the app).
 */
async function artUrl(kind: PetArt): Promise<string> {
  const target = new File(new Directory(widgetsDirectory), `pet-${kind}.png`);
  if (!target.exists) {
    const asset = await Asset.fromModule(ART[kind]).downloadAsync();
    if (asset.localUri) await new File(asset.localUri).copy(target);
  }
  return target.uri;
}

/** Show this snapshot on every "Us" widget (null = signed out: nothing personal). */
export async function publishWidgets(snapshot: WidgetSnapshot | null): Promise<void> {
  UsWidget.updateSnapshot(toUsWidgetProps(snapshot, await artUrl(petArtFor(snapshot))));
}

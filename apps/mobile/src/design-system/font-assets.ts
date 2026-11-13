import { fonts } from "./tokens";

/** Load only the faces used by the type scale. Replace an asset here to restyle that role.
 * Keep assets separate from pure tokens so server-side lint/contrast tools need no font loader.
 */
export const fontAssets = {
  [fonts.display600]: require("@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf"),
  [fonts.display500]: require("@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf"),
  [fonts.displayItalic]: require("@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf"),
  [fonts.ui400]: require("@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf"),
  [fonts.ui500]: require("@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf"),
  [fonts.ui600]: require("@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf"),
  [fonts.ui700]: require("@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf"),
  [fonts.hand500]: require("@expo-google-fonts/caveat/500Medium/Caveat_500Medium.ttf"),
  [fonts.hand600]: require("@expo-google-fonts/caveat/600SemiBold/Caveat_600SemiBold.ttf"),
};

/**
 * App entry. Expo Router renders the app; widgets register their Android task handler here so it
 * exists even when Android wakes the JS runtime just to draw a widget (no UI mounted).
 */
import "expo-router/entry";
import { registerWidgets } from "./src/features/widgets/register";

registerWidgets();

import { View } from "react-native";
import { Button } from "./Button";
import { Pet } from "./illustrations/pet";
import { Text } from "./Text";

type Props = { title?: string; body?: string; onRetry?: () => void; retrying?: boolean };

/** What happened + what to do + retry (DESIGN §7.2). */
export function ErrorState({
  title = "Couldn't reach your space",
  body = "Check your connection and try again. Nothing you've made is lost.",
  onRetry,
  retrying,
}: Props) {
  return (
    <View className="items-center gap-4 py-10" accessibilityRole="alert">
      <Pet stage="baby" mood="content" size={120} />
      <View className="items-center gap-2">
        <Text variant="heading" align="center">
          {title}
        </Text>
        <Text variant="body-sm" color="ink-secondary" align="center" style={{ maxWidth: 300 }}>
          {body}
        </Text>
      </View>
      {onRetry ? <Button variant="secondary" size="md" label="Try again" onPress={onRetry} loading={retrying} /> : null}
    </View>
  );
}

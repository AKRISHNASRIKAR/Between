import { MOOD_IDS, type PetMood } from "@lovenotes/contracts";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import {
  Avatar,
  Button,
  Chip,
  CodeField,
  ConfirmModal,
  Dots,
  EmptyState,
  ErrorState,
  MoodCreature,
  Pet,
  Screen,
  Sheet,
  Skeleton,
  Sparkle,
  Text,
  TextField,
  type TypeVariant,
  type as typeScale,
  useToast,
} from "@/design-system";

/** Dev-only: every design-system primitive in every state, for review at multiple sizes. */
export default function Gallery() {
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [code, setCode] = useState("AB2");
  const [chip, setChip] = useState(true);
  const moods: PetMood[] = ["content", "happy", "excited", "peckish", "sleepy"];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="gap-4">
      <Text variant="label" color="ink-tertiary">
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <Screen>
      <View className="gap-10 pt-2 pb-10">
        <BackButton />
        <Text variant="display-l">Design system</Text>

        <Section title="Type">
          {(Object.keys(typeScale) as TypeVariant[]).map((v) => (
            <Text key={v} variant={v} numberOfLines={1}>
              {v === "numeral" ? "8/10" : `${v} — little corner`}
            </Text>
          ))}
        </Section>

        <Section title="Buttons">
          <Button label="Primary" onPress={() => {}} fullWidth />
          <Button label="Loading" loading fullWidth />
          <Button label="Disabled" disabled fullWidth />
          <Button variant="secondary" label="Secondary" icon={Sparkle} onPress={() => {}} fullWidth />
          <Button variant="accent" family="purple" label="Reveal ✦" onPress={() => {}} />
          <Button variant="accent" family="cobalt" label="Cobalt accent" onPress={() => {}} />
          <Button variant="destructive" label="Destructive" onPress={() => {}} fullWidth />
          <Button variant="quiet" label="Quiet" onPress={() => {}} />
        </Section>

        <Section title="Inputs">
          <TextField label="Default" placeholder="Placeholder" />
          <TextField label="With error" value="nope" error="That doesn't look right. Try again." />
          <TextField label="Disabled" value="Can't touch this" editable={false} />
          <CodeField label="Code" length={8} groupAt={4} value={code} onChange={setCode} />
          <CodeField
            label="Code with error"
            length={6}
            value="12345"
            onChange={() => {}}
            error="That code didn't work."
          />
        </Section>

        <Section title="Chips">
          <View className="flex-row flex-wrap gap-2">
            <Chip label="Selected" selected={chip} onPress={() => setChip((c) => !c)} />
            <Chip label="Dream" family="green" selected />
            <Chip label="Place" />
            <Chip label="Disabled" disabled />
          </View>
        </Section>

        <Section title="Avatars">
          <View className="flex-row items-center gap-4">
            <Avatar name="Krishna" size={64} who="you" online />
            <Avatar name="Ananya" size={40} who="partner" />
            <Avatar name="A" size={28} />
          </View>
        </Section>

        <Section title="Loading">
          <Dots />
          <Skeleton height={80} radius="lg" />
          <Skeleton height={16} width="60%" radius="sm" />
        </Section>

        <Section title="Mood creatures">
          <View className="flex-row flex-wrap gap-3">
            {MOOD_IDS.map((m) => (
              <View key={m} className="items-center gap-1" style={{ width: 96 }}>
                <MoodCreature mood={m} size={80} />
                <Text variant="caption">{m}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Pet">
          <View className="flex-row flex-wrap gap-2">
            <Pet stage="egg" mood="content" size={120} />
            {moods.map((m) => (
              <View key={m} className="items-center">
                <Pet stage="baby" mood={m} size={120} />
                <Text variant="caption">{m}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Overlays">
          <Button variant="secondary" label="Open sheet" onPress={() => setSheet(true)} />
          <Button variant="secondary" label="Open modal" onPress={() => setModal(true)} />
          <Button
            variant="secondary"
            label="Toast"
            onPress={() => toast({ message: "Saved for later.", kind: "success" })}
          />
          <Button
            variant="secondary"
            label="Error toast"
            onPress={() =>
              toast({
                message: "Couldn't send. Tap to retry.",
                kind: "error",
                action: { label: "Retry", onPress: () => {} },
              })
            }
          />
        </Section>

        <Section title="States">
          <EmptyState
            illustration={<MoodCreature mood="calm" size={120} />}
            title="No memories yet"
            body="Start saving little moments together."
            action={{ label: "Add a memory", onPress: () => {} }}
          />
          <ErrorState onRetry={() => {}} />
        </Section>
      </View>

      <Sheet open={sheet} onClose={() => setSheet(false)} accessibilityLabel="Example sheet">
        <View className="gap-4 pb-4">
          <Text variant="display-m">A bottom sheet</Text>
          <Text variant="body" color="ink-secondary">
            Drag down or tap outside to close.
          </Text>
          <TextField label="Keyboard-aware" placeholder="Type here" />
          <Button fullWidth label="Done" onPress={() => setSheet(false)} />
        </View>
      </Sheet>
      <ConfirmModal
        open={modal}
        title="Leave this space?"
        body="This closes the space for both of you."
        confirmLabel="Leave"
        destructive
        onCancel={() => setModal(false)}
        onConfirm={() => setModal(false)}
      />
    </Screen>
  );
}

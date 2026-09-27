import { type DevPartnerAction, MOOD_IDS, type MoodId } from "@lovenotes/contracts";
import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { Avatar, Button, Chip, palette, radius, Screen, Text, useToast } from "@/design-system";
import { useCreateDevPartner, useDevPartner, useDevPartnerAct } from "@/features/dev/hooks";
import { useMe } from "@/features/space/hooks";
import { humanError } from "@/lib/errors";

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10, backgroundColor: palette.paper, borderRadius: radius.lg, padding: 16 }}>
      <Text variant="label" color="purple-deep">
        {title}
      </Text>
      {hint ? (
        <Text variant="caption" color="ink-tertiary">
          {hint}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

/**
 * DEV ONLY. Drive a simulated partner so every two-person flow can be tested on one device.
 * Actions go through the real API services, so events, bond and push logs behave exactly as live.
 */
export default function DevPartner() {
  const me = useMe();
  const status = useDevPartner();
  const create = useCreateDevPartner();
  const act = useDevPartnerAct();
  const toast = useToast();
  const [mood, setMood] = useState<MoodId>("joyful");

  if (!__DEV__) return <Redirect href="/" />;

  const run = (label: string, action: DevPartnerAction) =>
    act.mutate(action, {
      onSuccess: () => toast({ kind: "success", message: label }),
      onError: (e) => toast({ kind: "error", message: humanError(e) }),
    });

  const partner = status.data?.partner;
  const space = me.data?.space;

  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 8, paddingBottom: 24 }}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <Text variant="label" color="purple-deep">
            Developer
          </Text>
          <Text variant="display-l">Simulated partner</Text>
          <Text variant="body-sm" color="ink-secondary">
            Acts through the real API — you'll see live updates, bond and push logs exactly as with a real person.
          </Text>
        </View>

        {status.isError ? (
          <Text variant="body-sm" color="coral-deep">
            Dev tools are off. Set DEV_TOOLS=true in apps/api/.env and restart the API.
          </Text>
        ) : !space ? (
          <Text variant="body">Create a space first, then come back.</Text>
        ) : !partner ? (
          <Button
            label="Create partner “Ananya” and join"
            loading={create.isPending}
            onPress={() => create.mutate("Ananya")}
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={partner.displayName} who="partner" online={partner.online} />
              <View>
                <Text variant="heading">{partner.displayName}</Text>
                <Text variant="caption" color="ink-tertiary">
                  {partner.online ? "online" : "offline"}
                </Text>
              </View>
            </View>

            <Group title="Presence">
              <Button
                size="md"
                variant="secondary"
                label="Come online"
                onPress={() => run("Partner is online", { type: "online" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Go offline"
                onPress={() => run("Partner went offline", { type: "offline" })}
              />
            </Group>

            <Group title="Pet">
              <Button
                size="md"
                variant="secondary"
                label="Feed"
                onPress={() => run("Partner fed the pet", { type: "pet", kind: "feed" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Pet"
                onPress={() => run("Partner petted the pet", { type: "pet", kind: "pet" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Play"
                onPress={() => run("Partner played", { type: "pet", kind: "play" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Suggest “Biscuit”"
                onPress={() => run("Partner suggested a name", { type: "pet.proposeName", name: "Biscuit" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Accept my name"
                onPress={() => run("Partner accepted the name", { type: "pet.acceptName" })}
              />
            </Group>

            <Group title="Notes">
              <Button
                size="md"
                label="Send me a note"
                onPress={() => run("Partner left you a note", { type: "note.send" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Open my latest"
                onPress={() => run("Partner opened your note", { type: "note.openLatest" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Love my latest"
                onPress={() => run("Partner loved your note", { type: "note.reactLatest" })}
              />
            </Group>

            <Group title="Quizzes" hint="Answers randomly and completes every open quiz and today's question.">
              <Button
                size="md"
                label="Answer everything"
                onPress={() => run("Partner answered — check Know", { type: "quiz.answerAll" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Start “Who's more likely…”"
                onPress={() => run("Partner started a quiz", { type: "quiz.start", packSlug: "chaos-couple" })}
              />
            </Group>

            <Group title="Journal">
              <Button
                size="md"
                label="Write today's page"
                onPress={() => run("Partner wrote in your journal", { type: "journal.write" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Add a photo"
                onPress={() => run("Partner added a photo", { type: "journal.photo" })}
              />
            </Group>

            <Group title="Our future">
              <Button
                size="md"
                label="Add a dream"
                onPress={() => run("Partner added to your future", { type: "future.add" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Stamp the first one"
                onPress={() => run("Partner stamped one done", { type: "future.completeFirst" })}
              />
            </Group>

            <Group title="Today's vibe" hint="Pick a mood, then share it or keep it private.">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {MOOD_IDS.map((m) => (
                  <Chip key={m} label={m} selected={mood === m} onPress={() => setMood(m)} />
                ))}
              </View>
              <Button
                size="md"
                label="Share mood"
                onPress={() => run("Partner shared a mood", { type: "mood", mood, visibility: "shared" })}
              />
              <Button
                size="md"
                variant="secondary"
                label="Make it private"
                onPress={() => run("Partner's mood is private", { type: "mood", mood, visibility: "private" })}
              />
            </Group>
          </>
        )}
      </View>
    </Screen>
  );
}

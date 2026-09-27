import { UpcomingTab } from "@/components/UpcomingTab";
import { MoodCreature } from "@/design-system";

export default function Notes() {
  return (
    <UpcomingTab
      eyebrow="Notes"
      title="Little things you leave"
      illustration={<MoodCreature mood="grateful" size={120} />}
      body="Soon you'll be able to leave notes for each other — delivered by your pet."
    />
  );
}

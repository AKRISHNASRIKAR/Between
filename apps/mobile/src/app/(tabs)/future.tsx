import { UpcomingTab } from "@/components/UpcomingTab";
import { MoodCreature } from "@/design-system";

export default function Future() {
  return (
    <UpcomingTab
      eyebrow="Future"
      title="Our future"
      illustration={<MoodCreature mood="excited" size={120} />}
      body="Dreams, places and things to try together — with a stamp when you do them."
    />
  );
}

import { UpcomingTab } from "@/components/UpcomingTab";
import { MoodCreature } from "@/design-system";

export default function Remember() {
  return (
    <UpcomingTab
      eyebrow="Remember"
      title="Your shared journal"
      illustration={<MoodCreature mood="joyful" size={120} />}
      body="A diary and photo scrapbook you both write in is coming next."
    />
  );
}

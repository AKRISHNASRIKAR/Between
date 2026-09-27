import { UpcomingTab } from "@/components/UpcomingTab";
import { MoodCreature } from "@/design-system";

export default function Know() {
  return (
    <UpcomingTab
      eyebrow="Know"
      title="How well do you know each other?"
      illustration={<MoodCreature mood="confused" size={120} />}
      body="Quizzes and a daily question for the two of you are on their way."
    />
  );
}

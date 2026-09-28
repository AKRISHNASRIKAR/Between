import type { PetTimelineItem } from "@lovenotes/contracts";

export type Entry = { item: PetTimelineItem; times: number };

/** Back-to-back identical care ("you played, you played") reads as one moment. */
export function groupCare(items: PetTimelineItem[]): Entry[] {
  const out: Entry[] = [];
  for (const item of items) {
    const prev = out.at(-1);
    if (
      prev &&
      item.type === "care" &&
      prev.item.type === "care" &&
      prev.item.kind === item.kind &&
      prev.item.byUserId === item.byUserId
    )
      prev.times++;
    else out.push({ item, times: 1 });
  }
  return out;
}

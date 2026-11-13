import type { JournalBlock, JournalPage, Note, Paper } from "@lovenotes/contracts";

/** Idempotent success can refer to an earlier committed payload after a lost response. */
export const noteAcknowledges = (saved: Pick<Note, "body" | "paper">, sent: { body: string; paper: Paper }) =>
  saved.body === sent.body && saved.paper === sent.paper;
const sameIds = (actual: string[], expected: string[]) =>
  actual.length === expected.length && actual.every((id, index) => id === expected[index]);
export const blockAcknowledges = (
  saved: JournalBlock | undefined,
  sent: { id: string; body: string | null; mediaIds: string[] },
) =>
  !!saved &&
  saved.id === sent.id &&
  saved.body === sent.body &&
  sameIds(
    saved.media.map((media) => media.id),
    sent.mediaIds,
  );
export const pageAcknowledges = (
  saved: JournalPage,
  sent: {
    id: string;
    blockId: string;
    pageDate: string;
    title: string | null;
    body: string | null;
    mediaIds: string[];
  },
) =>
  saved.id === sent.id &&
  saved.pageDate === sent.pageDate &&
  saved.title === sent.title &&
  blockAcknowledges(
    saved.blocks.find((block) => block.id === sent.blockId),
    { ...sent, id: sent.blockId },
  );

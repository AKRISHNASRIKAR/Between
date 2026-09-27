import { z } from "zod";

export const Id = z.uuid();
export type Id = z.infer<typeof Id>;

/** Calendar date in the user's local timezone, `YYYY-MM-DD`. */
export const LocalDate = z.iso.date();
export type LocalDate = z.infer<typeof LocalDate>;

export const IsoDateTime = z.iso.datetime({ offset: true });
export type IsoDateTime = z.infer<typeof IsoDateTime>;

export const Timezone = z.string().min(1).max(64);

export const Page = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

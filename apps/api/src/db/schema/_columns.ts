import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () => uuid().primaryKey().defaultRandom();
export const ts = () => timestamp({ withTimezone: true, mode: "date" });
export const createdAt = () => ts().notNull().defaultNow();
export const updatedAt = () =>
  ts()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

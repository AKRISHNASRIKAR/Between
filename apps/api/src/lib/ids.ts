/** Server-generated ids are UUIDv7 (time-ordered). Client-created content supplies its own UUID. */
export const newId = () => Bun.randomUUIDv7();

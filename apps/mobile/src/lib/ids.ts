import { randomUUID } from "expo-crypto";

/** Client-generated ids make every create idempotent (SPEC §12). */
export const newId = () => randomUUID();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

export const sql = postgres(env.DATABASE_URL, { max: 10, onnotice: () => {} });
export const db = drizzle(sql, { schema, casing: "snake_case" });
export type Db = typeof db;
/** A transaction handle or the root db — repositories accept either. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0] | Db;

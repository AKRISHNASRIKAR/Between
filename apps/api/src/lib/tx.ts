import { db, type Tx } from "../db/client";

/**
 * Run `fn` in a transaction. Side effects (realtime, notices, push) never go inside: the service
 * returns what happened, and announces it after `withTx` resolves — i.e. only once committed.
 */
export function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction((tx) => fn(tx));
}

import { db, type Tx } from "../db/client";

type AfterCommit = (fn: () => void | Promise<void>) => void;

/**
 * Run `fn` in a transaction. Side effects registered via `after` (realtime, push) run only once the
 * transaction has committed — never for rolled-back work.
 */
export async function withTx<T>(fn: (tx: Tx, after: AfterCommit) => Promise<T>): Promise<T> {
  const effects: Array<() => void | Promise<void>> = [];
  const result = await db.transaction((tx) => fn(tx, (effect) => effects.push(effect)));
  for (const effect of effects) {
    try {
      await effect();
    } catch (err) {
      console.error("after-commit effect failed", err);
    }
  }
  return result;
}

/** Storage-agnostic draft lifecycle. Keys include account, space and editor; no shared default owner. */
export type DraftScope = { userId: string; spaceId: string; editor: string };
export type DraftRecord<T> = { version: 1; id: string; revision: number; value: T };
export type DraftToken = { id: string; revision: number };
type Storage = { getSync(key: string): string | null; setSync(key: string, value: string): void };
export const draftKey = (scope: DraftScope) =>
  `between-draft:v1:${encodeURIComponent(scope.userId)}:${encodeURIComponent(scope.spaceId)}:${encodeURIComponent(scope.editor)}`;

export function createDraftStore(storage: Storage, newId: () => string) {
  const cache = new Map<string, DraftRecord<unknown>>();
  const listeners = new Map<string, Set<() => void>>();
  const failures = new Set<string>();
  const notify = (key: string) =>
    listeners.get(key)?.forEach((listener) => {
      listener();
    });
  function read<T>(scope: DraftScope, create: () => T, valid: (value: unknown) => value is T): DraftRecord<T> {
    const key = draftKey(scope);
    const cached = cache.get(key);
    if (cached) return cached as DraftRecord<T>;
    let saved: unknown;
    try {
      saved = JSON.parse(storage.getSync(key) ?? "null");
    } catch {
      saved = null;
      failures.add(key);
    }
    const record = saved as Partial<DraftRecord<T>> | null;
    const next: DraftRecord<T> =
      record?.version === 1 &&
      typeof record.id === "string" &&
      record.id.length > 0 &&
      Number.isSafeInteger(record.revision) &&
      (record.revision ?? -1) >= 0 &&
      valid(record.value)
        ? (record as DraftRecord<T>)
        : { version: 1, id: newId(), revision: 0, value: create() };
    cache.set(key, next);
    return next;
  }
  function write<T>(scope: DraftScope, record: DraftRecord<T>) {
    const key = draftKey(scope);
    cache.set(key, record);
    try {
      storage.setSync(key, JSON.stringify(record));
      failures.delete(key);
    } catch {
      failures.add(key);
    }
    notify(key);
    return record;
  }
  return {
    read,
    subscribe(scope: DraftScope, listener: () => void) {
      const key = draftKey(scope);
      const set = listeners.get(key) ?? new Set();
      set.add(listener);
      listeners.set(key, set);
      return () => {
        set.delete(listener);
      };
    },
    failed: (scope: DraftScope) => failures.has(draftKey(scope)),
    update<T>(scope: DraftScope, create: () => T, valid: (value: unknown) => value is T, update: (value: T) => T) {
      const record = read(scope, create, valid);
      return write(scope, { ...record, revision: record.revision + 1, value: update(record.value) });
    },
    rebase<T>(
      scope: DraftScope,
      token: DraftToken,
      create: () => T,
      valid: (value: unknown) => value is T,
      transform: (value: T) => T = (value) => value,
    ) {
      const current = read(scope, create, valid);
      if (current.id !== token.id) return false;
      write(scope, { ...current, id: newId(), value: transform(current.value) });
      return true;
    },
    acknowledge<T>(
      scope: DraftScope,
      token: DraftToken,
      create: () => T,
      valid: (value: unknown) => value is T,
      rebase: (value: T) => T = (value) => value,
    ) {
      const current = read(scope, create, valid);
      // A response from an old save must never erase a newer edit or a replacement draft.
      if (current.id !== token.id) return false;
      if (current.revision !== token.revision) {
        write(scope, { ...current, id: newId(), value: rebase(current.value) });
        return false;
      }
      write(scope, { version: 1, id: newId(), revision: 0, value: create() });
      return true;
    },
  };
}

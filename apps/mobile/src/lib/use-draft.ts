import { useMemo, useSyncExternalStore } from "react";
import { createDraftStore, type DraftScope, type DraftToken } from "./draft-store";
import { newId } from "./ids";
import { kv } from "./kv";

const drafts = createDraftStore(kv, newId);

export function useDraft<T>(scope: DraftScope | null, create: () => T, valid: (value: unknown) => value is T) {
  const enabled = !!scope;
  const userId = scope?.userId ?? "unresolved";
  const spaceId = scope?.spaceId ?? "";
  const editor = scope?.editor ?? "ephemeral";
  const ephemeral = useMemo(() => newId(), []);
  const scoped = useMemo(
    () => ({ userId, spaceId: spaceId || ephemeral, editor }),
    [userId, spaceId, editor, ephemeral],
  );
  const store = useMemo(
    () => (enabled ? drafts : createDraftStore({ getSync: () => null, setSync: () => {} }, newId)),
    [enabled],
  );
  const record = useSyncExternalStore(
    (listener) => store.subscribe(scoped, listener),
    () => store.read(scoped, create, valid),
    () => store.read(scoped, create, valid),
  );
  return {
    ...record,
    savedLocally: !!scope && !store.failed(scoped),
    update: (update: (value: T) => T) => store.update(scoped, create, valid, update),
    acknowledge: (token: DraftToken, rebase?: (value: T) => T) =>
      store.acknowledge(scoped, token, create, valid, rebase),
    rebase: (token: DraftToken, transform?: (value: T) => T) => store.rebase(scoped, token, create, valid, transform),
  };
}

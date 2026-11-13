import type { Query } from "@tanstack/react-query";

/** Cache shapes and ownership must both match before data is restored from disk. */
export const cacheBuster = (userId: string | undefined) => `v2:${userId ?? "signed-out"}`;

export const shouldPersistQuery = (query: Query) => query.state.status === "success" && query.meta?.persist !== false;

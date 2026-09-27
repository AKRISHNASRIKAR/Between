/** Type-only entry for the mobile client: `hc<AppType>(baseUrl + "/v1")`. */
export type { v1 as AppRoutes } from "./app";

import type { v1 } from "./app";
export type AppType = typeof v1;

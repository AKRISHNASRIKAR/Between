import type { SpaceScope } from "./lib/scope";

export type AuthedUser = { id: string; email: string; name: string; image: string | null; timezone: string };

export type AppEnv = {
  Variables: {
    user: AuthedUser;
    scope: SpaceScope;
  };
};

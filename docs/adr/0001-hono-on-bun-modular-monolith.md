# Hono on Bun as one modular monolith

The API is a single Hono app on Bun, split into feature modules, instead of NestJS or microservices. About 40 endpoints and a small team don't justify DI containers and decorators, NestJS on Bun is its least-tested path, and Hono's typed RPC client lets the mobile app call the API with compile-time types from the same Zod contracts. Module boundaries (not deployment boundaries) keep it modular; hosting stays portable because only `index.ts`, `realtime/hub.ts` and `lib/storage.ts` touch the runtime.

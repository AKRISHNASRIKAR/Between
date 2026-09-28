/**
 * Architecture lint for apps/api (docs/architecture/api.md). Two rules:
 *
 * 1. Only repositories touch tables: `db/schema` may be imported only from `*.repo.ts` files and
 *    from `src/db/**` + `src/auth.ts` (Better Auth's adapter needs the schema).
 * 2. Modules talk through their front door: code outside `modules/<m>/` may import from that
 *    module only via its `index.ts` (tests may reach in, to test internals).
 */
import { Glob } from "bun";

const ROOT = new URL("../apps/api/", import.meta.url).pathname;
const IMPORT = /(?:import|export)[^"']*?from\s+["']([^"']+)["']/g;

const problems: string[] = [];

for await (const rel of new Glob("{src,test}/**/*.ts").scan(ROOT)) {
  const text = await Bun.file(ROOT + rel).text();
  const here = rel.split("/");
  const ownModule = here[1] === "modules" ? here[2] : null;

  for (const [, spec] of text.matchAll(IMPORT)) {
    if (!spec?.startsWith(".")) continue;
    const target = new URL(spec, `file://${ROOT}${rel}`).pathname.slice(ROOT.length);

    if (/^src\/db\/schema(\/|$)/.test(target)) {
      const allowed =
        rel.endsWith(".repo.ts") || rel.startsWith("src/db/") || rel === "src/auth.ts" || rel.startsWith("test/");
      if (!allowed) problems.push(`${rel}: imports db/schema — move the query into a *.repo.ts`);
    }

    const m = target.match(/^src\/modules\/([^/]+)\/(.+)$/);
    if (m && m[1] !== ownModule && !rel.startsWith("test/")) {
      const [, mod, file] = m;
      if (file !== "index" && file !== "index.ts")
        problems.push(`${rel}: reaches into modules/${mod}/${file} — import from "modules/${mod}"`);
    }
  }
}

if (problems.length) {
  console.error(`✗ architecture: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.info("✓ architecture: repositories own tables, modules import through index.ts");

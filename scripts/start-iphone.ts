import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const logs = join(root, ".design-system", "dev");
const checkOnly = process.argv.includes("--check");
const apiDirectory = join(root, "apps", "api");
const mobileDirectory = join(root, "apps", "mobile");
const config = JSON.parse(readFileSync(join(mobileDirectory, "app.json"), "utf8")).expo;

function command(args: string[], cwd = root, allowFailure = false) {
  const result = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0 && !allowFailure)
    throw new Error(`${args[0]} ${args[1] ?? ""} failed: ${result.stderr.toString().trim()}`);
  return { ok: result.exitCode === 0, text: result.stdout.toString().trim() };
}

function projectListener(port: number) {
  const output = command(["lsof", "-t", `-iTCP:${port}`, "-sTCP:LISTEN"], root, true).text;
  const pids = [...new Set(output.split(/\s+/).filter(Boolean))];
  for (const pid of pids) {
    const cwd = command(["lsof", "-a", "-p", pid, "-d", "cwd", "-Fn"])
      .text.split("\n")
      .find((line) => line.startsWith("n"))
      ?.slice(1);
    if (!cwd || !(cwd === root || cwd.startsWith(`${root}/`)))
      throw new Error(`Port ${port} belongs to another project (PID ${pid}). No process was stopped.`);
  }
  return pids.length > 0;
}

function assertLocalDatabase() {
  const envPath = join(apiDirectory, ".env");
  const contents = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const fromFile = contents.match(/^DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
  const database = process.env.DATABASE_URL || fromFile;
  if (!database) throw new Error("Set up apps/api/.env from .env.example before starting the local API.");
  let hostname: string;
  try {
    hostname = new URL(database).hostname;
  } catch {
    throw new Error("The configured DATABASE_URL is not a valid URL.");
  }
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname))
    throw new Error(
      "This local startup command only migrates a localhost database. Start remote environments explicitly.",
    );
}

function start(args: string[], cwd: string, filename: string) {
  mkdirSync(logs, { recursive: true });
  const fd = openSync(join(logs, filename), "a");
  const child = spawn(args[0] ?? "bun", args.slice(1), {
    cwd,
    env: process.env,
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  console.info(`Started ${filename.replace(".log", "")} (PID ${child.pid}); logs: ${join(logs, filename)}`);
}

async function waitFor(url: string, name: string) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  }
  throw new Error(`${name} did not become ready within 60 seconds. Inspect ${logs}.`);
}

async function main() {
  const apiRunning = projectListener(3000);
  const metroRunning = projectListener(8081);
  if (checkOnly) {
    console.info(`Project API: ${apiRunning ? "running" : "stopped"}; Metro: ${metroRunning ? "running" : "stopped"}.`);
    if (!apiRunning || !metroRunning)
      throw new Error("Run bun run iphone to start missing services and open the device window.");
    await waitFor("http://127.0.0.1:3000/health", "API");
    await waitFor("http://127.0.0.1:8081/status", "Metro");
    console.info("Both services respond. Check mode made no configuration, database or simulator changes.");
    return;
  }
  assertLocalDatabase();
  console.info("Ensuring the local API schema is current…");
  command(["bun", "run", "db:migrate"], apiDirectory);
  if (!apiRunning) {
    start(["bun", "run", "dev"], apiDirectory, "api.log");
  }
  if (!metroRunning) start(["bunx", "expo", "start", "--port", "8081", "--host", "lan"], mobileDirectory, "metro.log");
  await waitFor("http://127.0.0.1:3000/health", "API");
  await waitFor("http://127.0.0.1:8081/status", "Metro");

  const developer = command(["xcode-select", "-p"]).text;
  const viewers = [
    join(dirname(developer), "Applications", "DeviceHub.app"),
    join(developer, "Applications", "Simulator.app"),
  ];
  const viewer = viewers.find(existsSync);
  if (!viewer) throw new Error(`No DeviceHub/Simulator application found under ${developer}.`);
  const deviceList = JSON.parse(command(["xcrun", "simctl", "list", "devices", "available", "-j"]).text) as {
    devices: Record<string, Array<{ name: string; udid: string; state: string }>>;
  };
  const devices = Object.values(deviceList.devices)
    .flat()
    .filter((device) => device.name === "iPhone 17");
  const device = devices.find((entry) => entry.state === "Booted") ?? devices[0];
  if (!device) throw new Error("Install an iOS simulator runtime and create an iPhone 17 device in Xcode first.");
  if (device.state !== "Booted") command(["xcrun", "simctl", "boot", device.udid]);
  command(["xcrun", "simctl", "bootstatus", device.udid, "-b"]);
  command(["open", viewer]);
  const launched = command(["xcrun", "simctl", "launch", device.udid, config.ios.bundleIdentifier], root, true);
  if (!launched.ok)
    throw new Error(
      "Between is not installed on iPhone 17. Build it once with bun run ios in apps/mobile, then retry.",
    );
  command([
    "xcrun",
    "simctl",
    "openurl",
    device.udid,
    `${config.scheme}://expo-development-client/?url=${encodeURIComponent("http://127.0.0.1:8081")}`,
  ]);
  command(["xcrun", "simctl", "openurl", device.udid, `${config.scheme}:///`]);
  command(["open", viewer]);
  console.info(`Between launched on ${device.name}. Device window opened with ${viewer}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to start Between.");
  process.exitCode = 1;
});

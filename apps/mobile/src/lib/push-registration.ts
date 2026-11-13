export type PushResult = "registered" | "denied" | "unavailable";
type PreparedPush = { token: string } | { status: "denied" | "unavailable" };
type PushDependencies = {
  prepare: () => Promise<PreparedPush>;
  load: () => Promise<string | null>;
  save: (token: string) => Promise<void>;
  clear: () => Promise<void>;
  put: (token: string) => Promise<void>;
  delete: (token: string) => Promise<void>;
};

/** Fence work from old sessions; serialize token writes with sign-out removal. */
export class PushRegistration {
  private epoch = 0;
  private enabled = true;
  private token: string | null = null;
  private writes = new Set<Promise<PushResult>>();
  private registration: { epoch: number; promise: Promise<PushResult> } | undefined;

  constructor(private readonly deps: PushDependencies) {}

  beginSession() {
    this.enabled = true;
  }

  suspend() {
    this.enabled = false;
    this.epoch++;
  }

  register(): Promise<PushResult> {
    if (!this.enabled) return Promise.resolve("unavailable");
    const epoch = this.epoch;
    if (this.registration?.epoch === epoch) return this.registration.promise;
    const promise = this.prepareAndRegister(epoch);
    this.registration = { epoch, promise };
    void promise.finally(() => {
      if (this.registration?.promise === promise) this.registration = undefined;
    });
    return promise;
  }

  private current(epoch: number) {
    return this.enabled && this.epoch === epoch;
  }

  private async prepareAndRegister(epoch: number): Promise<PushResult> {
    try {
      const prepared = await this.deps.prepare();
      if (!this.current(epoch)) return "unavailable";
      if ("status" in prepared) return prepared.status;
      this.token = prepared.token;
      const write = this.saveAndPut(prepared.token, epoch);
      this.writes.add(write);
      try {
        return await write;
      } finally {
        this.writes.delete(write);
      }
    } catch {
      return "unavailable";
    }
  }

  private async saveAndPut(token: string, epoch: number): Promise<PushResult> {
    // Persist first, so a cold launch can still revoke a token registered by this device.
    await this.deps.save(token);
    if (!this.current(epoch)) return "unavailable";
    await this.deps.put(token);
    return this.current(epoch) ? "registered" : "unavailable";
  }

  async unregister() {
    this.suspend();
    // Permission prompts/token acquisition may remain pending; only server writes must drain.
    await Promise.allSettled([...this.writes]);
    const token = this.token ?? (await this.deps.load());
    if (!token) return;
    // Retain the persisted token if the remote removal fails, for a later retry.
    await this.deps.delete(token);
    await this.deps.clear();
    this.token = null;
  }
}

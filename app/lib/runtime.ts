import { AsyncLocalStorage } from "node:async_hooks";

type RuntimeBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  SPARKS_OWNER_EMAIL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
};

const runtime = new AsyncLocalStorage<RuntimeBindings>();

export function runtimeBindings() {
  return runtime.getStore() ?? {};
}

export function withRuntimeBindings<T>(bindings: RuntimeBindings, callback: () => T): T {
  return runtime.run(bindings, callback);
}

import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url);
const client = new URL("client/", dist);
const server = new URL("server/", dist);
const pages = new URL("pages/", dist);
const worker = new URL("_worker.js/", pages);

await rm(pages, { recursive: true, force: true });
await mkdir(pages, { recursive: true });
await cp(client, pages, { recursive: true });
await cp(server, worker, { recursive: true });
await rm(join(worker.pathname, "wrangler.json"), { force: true });

console.log("Prepared Cloudflare Pages output in dist/pages.");

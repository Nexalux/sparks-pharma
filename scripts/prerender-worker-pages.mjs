import { mkdir, writeFile } from "node:fs/promises";
import worker from "../dist/server/index.js";

const directory = new URL("../dist/client/_sparks-pages/", import.meta.url);
await mkdir(directory, { recursive: true });
const assets = { fetch: async () => new Response("Not found", { status: 404 }) };
const context = { waitUntil() {}, passThroughOnException() {} };

for (const [path, file] of [["/", "home.snapshot"], ["/products", "products.snapshot"]]) {
  const request = new Request("https://prerender.sparks.invalid" + path, {
    headers: { accept: "text/html" },
  });
  const response = await worker.fetch(request, { ASSETS: assets }, context);
  const html = await response.text();
  if (!response.ok || !html.includes("Loading published products")) {
    throw new Error(`Could not prerender ${path} (HTTP ${response.status}).`);
  }
  await writeFile(new URL(file, directory), html);
}

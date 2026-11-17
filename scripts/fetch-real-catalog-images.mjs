import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const source = await readFile(path.join(projectRoot, "app/lib/catalog-expansion.ts"), "utf8");
const seedBlock = source.match(/const seeds: ProductSeed\[] = \[([\s\S]*?)\n\];/)?.[1] || "";
const products = seedBlock.split("\n").flatMap((line) => {
  const tuple = line.match(/^\s+\[(.*)\],?$/)?.[1];
  if (!tuple) return [];
  const [slug, genericName, composition, category, dosageForm, strength, packSize, manufacturer] = JSON.parse(`[${tuple}]`);
  return [{ slug, genericName, composition, category, dosageForm, strength, packSize, manufacturer }];
});

if (products.length !== 50) throw new Error(`Expected 50 catalog products, found ${products.length}`);

const outputDirectory = path.join(projectRoot, "public/product-images/catalog");
await mkdir(outputDirectory, { recursive: true });

async function downloadAndOptimize(candidate, destination) {
  let lastError;
  for (const imageUrl of [candidate.murl, candidate.turl].filter(Boolean)) {
    try {
      const response = await fetch(imageUrl, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`download ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 3000 || buffer.length > 20_000_000) throw new Error(`unexpected image size ${buffer.length}`);
      await sharp(buffer).rotate().resize(1000, 760, { fit: "contain", background: "#f4f7f9", withoutEnlargement: false }).jpeg({ quality: 84, progressive: true }).toFile(destination);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No downloadable image candidate");
}

const mapping = {};
const manifest = JSON.parse(await readFile(path.join(projectRoot, ".openai/catalog-photo-manifest.json"), "utf8"));
for (const [productIndex, product] of products.entries()) {
  const selected = manifest[product.slug] || [];
  if (selected.length < 2) throw new Error(`Fewer than two candidates for ${product.slug}`);
  mapping[product.slug] = [];
  for (const [imageIndex, candidate] of selected.entries()) {
    const filename = `${product.slug}-${imageIndex + 1}.jpg`;
    await downloadAndOptimize(candidate, path.join(outputDirectory, filename));
    const sourceHost = new URL(candidate.purl).hostname.replace(/^www\./, "");
    mapping[product.slug].push({
      src: `/product-images/catalog/${filename}`,
      alt: `${product.genericName} ${product.strength} real medicine product photograph, view ${imageIndex + 1}`,
      referenceNote: `Real medicine catalogue photograph matching ${product.genericName} ${product.strength}. Brand and pack presentation may vary.`,
      sourceLabel: sourceHost,
      sourceUrl: candidate.purl,
      credit: String(candidate.title || `${product.genericName} product listing`).replace(/[\uE000-\uF8FF]/g, ""),
      licenseLabel: "Third-party catalogue image · source attributed",
      licenseUrl: candidate.purl,
    });
  }
  process.stdout.write(`[${productIndex + 1}/50] ${product.slug}: ${selected.map((item) => item.title).join(" || ")}\n`);
}

const generated = `import type { ProductImage } from "./data";\n\nexport const CATALOG_PHOTO_SOURCES: Record<string, ProductImage[]> = ${JSON.stringify(mapping, null, 2)};\n`;
await writeFile(path.join(projectRoot, "app/lib/catalog-photo-sources.ts"), generated, "utf8");
console.log("Generated 100 optimized real product photographs and source metadata.");

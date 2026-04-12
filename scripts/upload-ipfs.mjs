import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { NFTStorage, File } from "nft.storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "metadata");

const token = process.env.NFT_STORAGE_TOKEN;
if (!token) {
  console.error("Définis NFT_STORAGE_TOKEN (clé API nft.storage).");
  process.exit(1);
}

const client = new NFTStorage({ token });
const start = parseInt(process.argv[2] || "1", 10);
const end = parseInt(process.argv[3] || "10", 10);

async function uploadOne(id) {
  const pngPath = path.join(OUT, `${id}.png`);
  const jsonPath = path.join(OUT, `${id}.json`);
  const image = await fs.readFile(pngPath);
  const metadata = JSON.parse(await fs.readFile(jsonPath, "utf8"));

  const result = await client.store({
    name: metadata.name,
    description: metadata.description,
    image: new File([image], `${id}.png`, { type: "image/png" }),
    properties: {
      attributes: metadata.attributes,
    },
  });

  console.log(`#${id} → ${result.url}`);
}

async function main() {
  for (let id = start; id <= end; id++) {
    try {
      await uploadOne(id);
    } catch (e) {
      console.error(`Erreur #${id}:`, e.message);
    }
  }
}

main();

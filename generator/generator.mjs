import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas } from "@napi-rs/canvas";
import { renderJersey, rollTraits, mulberry32 } from "../frontend/js/jersey-art.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const teams = JSON.parse(
  fs.readFileSync(path.join(root, "frontend", "data", "teams.json"), "utf8")
);

const WIDTH = 500;
const HEIGHT = 500;
const OUT = path.join(root, "metadata");
const COUNT = process.argv[2] ? parseInt(process.argv[2], 10) : 1000;

if (Number.isNaN(COUNT) || COUNT < 1) {
  console.error("Usage: npm run generate -- [count]");
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const createOffscreen = (w, h) => createCanvas(w, h);

for (let id = 1; id <= COUNT; id++) {
  const rng = mulberry32((id * 2654435761) >>> 0);
  const traits = rollTraits(teams, rng);
  const canvas = createCanvas(WIDTH, HEIGHT);
  renderJersey(canvas, traits, rng, createOffscreen);
  const png = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(OUT, `${id}.png`), png);

  const metadata = {
    name: `Ice League #${id}`,
    description:
      "Digital Jersey Universe — maillot génératif inspiré hockey, équipes fictives, sans logos officiels.",
    image: `ipfs://CID_A_REMPLACER/${id}.png`,
    attributes: [
      { trait_type: "Team", value: traits.team },
      { trait_type: "Jersey Type", value: traits.jerseyType },
      { trait_type: "Pattern", value: traits.pattern },
      { trait_type: "Rarity", value: traits.rarity },
    ],
  };
  fs.writeFileSync(
    path.join(OUT, `${id}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

console.log(`Généré ${COUNT} fichiers dans metadata/`);

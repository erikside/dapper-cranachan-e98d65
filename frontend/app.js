import {
  CONTRACT_ADDRESS,
  ABI,
  DROP_TIMESTAMP_MS,
  MAX_SUPPLY_UI,
} from "./config.js";
import { renderJersey, rollTraits, mulberry32 } from "./js/jersey-art.js";

const ethers = globalThis.ethers;

const connectBtn = document.getElementById("connect");
const regenBtn = document.getElementById("regen");
const mintPublicBtn = document.getElementById("mint-public");
const mintWlBtn = document.getElementById("mint-wl");
const statusEl = document.getElementById("status");
const canvas = document.getElementById("preview-canvas");
const traitsEl = document.getElementById("traits");
const supplyEl = document.getElementById("supply");
const myMintsEl = document.getElementById("my-mints");
const priceEl = document.getElementById("mint-price");
const stateEl = document.getElementById("mint-state");
const countdownEl = document.getElementById("countdown");
const walletShortEl = document.getElementById("wallet-short");

let teams = [];
let provider;
let signer;
let contract;

function createOffscreen(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function showTraits(t) {
  traitsEl.innerHTML = `
    <dl>
      <dt>Team</dt><dd>${t.team}</dd>
      <dt>Jersey Type</dt><dd>${t.jerseyType}</dd>
      <dt>Pattern</dt><dd>${t.pattern}</dd>
      <dt>Rareté</dt><dd>${t.rarity}</dd>
      <dt>Numéro</dt><dd>#${t.number}</dd>
    </dl>
  `;
}

function randomPreview() {
  const seed = (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
  const rng = mulberry32(seed);
  const traits = rollTraits(teams, rng);
  renderJersey(canvas, traits, rng, createOffscreen);
  showTraits(traits);
}

function shortAddr(a) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function isConfigReady() {
  return (
    CONTRACT_ADDRESS &&
    !CONTRACT_ADDRESS.includes("TON_CONTRACT") &&
    !CONTRACT_ADDRESS.includes("ICI")
  );
}

async function readChainStats() {
  if (!isConfigReady() || !window.ethereum) {
    supplyEl.textContent = `— / ${MAX_SUPPLY_UI}`;
    priceEl.textContent = "—";
    stateEl.textContent = "Hors ligne";
    return;
  }
  try {
    const readProvider = new ethers.BrowserProvider(window.ethereum);
    const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
    const [total, maxS, price, paused] = await Promise.all([
      c.totalSupply(),
      c.maxSupply(),
      c.price(),
      c.paused(),
    ]);
    supplyEl.textContent = `${total} / ${maxS}`;
    priceEl.textContent = `${ethers.formatEther(price)} ETH`;
    stateEl.textContent = paused ? "Pause (public)" : "Mint ouvert";
    stateEl.style.color = paused ? "#fbbf24" : "var(--cyan, #2de1ff)";

    if (signer) {
      const addr = await signer.getAddress();
      const mine = await c.minted(addr);
      const maxW = await c.maxPerWallet();
      myMintsEl.textContent = `${mine} / ${maxW}`;
    } else {
      myMintsEl.textContent = "—";
    }
  } catch (e) {
    console.warn(e);
    supplyEl.textContent = `— / ${MAX_SUPPLY_UI}`;
    stateEl.textContent = "RPC / contrat";
  }
}

function tickCountdown() {
  if (DROP_TIMESTAMP_MS == null) return;
  const end = DROP_TIMESTAMP_MS;
  const now = Date.now();
  const left = end - now;
  if (left <= 0) {
    countdownEl.textContent = "Le mint est live — vérifie le statut ci-dessus.";
    return;
  }
  const s = Math.floor(left / 1000) % 60;
  const m = Math.floor(left / 60000) % 60;
  const h = Math.floor(left / 3600000) % 24;
  const d = Math.floor(left / 86400000);
  countdownEl.textContent = `${d}j ${h}h ${m}m ${s}s`;
}

connectBtn.onclick = async () => {
  if (!window.ethereum) {
    alert("Installe MetaMask (ou équivalent)");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const addr = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    walletShortEl.hidden = false;
    walletShortEl.textContent = shortAddr(addr);
    connectBtn.textContent = "Connecté";
    statusEl.textContent = "Wallet connecté.";
    await readChainStats();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Connexion annulée.";
  }
};

async function mintWith(fnName) {
  if (!contract) {
    alert("Connecte ton wallet.");
    return;
  }
  if (!isConfigReady()) {
    alert("Renseigne CONTRACT_ADDRESS dans config.js après déploiement.");
    return;
  }
  try {
    const price = await contract.price();
    const qty = 1n;
    const value = price * qty;
    statusEl.textContent = "Transaction en cours…";
    const tx =
      fnName === "mintWhitelist"
        ? await contract.mintWhitelist(qty, { value })
        : await contract.mint(qty, { value });
    await tx.wait();
    statusEl.textContent = "Mint confirmé.";
    await readChainStats();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Mint refusé ou erreur (voir console).";
  }
}

mintPublicBtn.onclick = () => mintWith("mint");
mintWlBtn.onclick = () => mintWith("mintWhitelist");
regenBtn.onclick = () => randomPreview();

window.ethereum?.on?.("accountsChanged", () => {
  signer = undefined;
  contract = undefined;
  connectBtn.textContent = "Connect Wallet";
  walletShortEl.hidden = true;
  readChainStats();
});

window.ethereum?.on?.("chainChanged", () => {
  window.location.reload();
});

async function init() {
  const res = await fetch("./data/teams.json");
  if (!res.ok) throw new Error("teams.json");
  teams = await res.json();
  randomPreview();

  tickCountdown();
  if (DROP_TIMESTAMP_MS != null) {
    setInterval(tickCountdown, 1000);
  }

  await readChainStats();
  setInterval(readChainStats, 15000);
}

init().catch((e) => {
  console.error(e);
  statusEl.textContent = "Erreur chargement des données.";
});

/** Adresse du contrat après déploiement */
export const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

/** Timestamp UTC du mint (ms). null = pas de compte à rebours automatique */
export const DROP_TIMESTAMP_MS = null;

export const MAX_SUPPLY_UI = 1000;

export const ABI = [
  "function mint(uint256 quantity) external payable",
  "function mintWhitelist(uint256 quantity) external payable",
  "function price() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
  "function minted(address) view returns (uint256)",
  "function paused() view returns (bool)",
  "function whitelist(address) view returns (bool)",
];

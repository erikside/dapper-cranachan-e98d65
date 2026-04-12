/**
 * ICE LEAGUE — Digital Jersey Universe (équipes & motifs fictifs).
 */

export const PATTERNS = [
  { name: "Clean", weight: 50 },
  { name: "Stripe", weight: 25 },
  { name: "Camo", weight: 15 },
  { name: "Neon", weight: 7 },
  { name: "Glitch", weight: 3 },
];

export function weightedRandom(items, rng) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    if (r < item.weight) return item.name;
    r -= item.weight;
  }
  return items[items.length - 1].name;
}

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbStr({ r, g, b }, a = 1) {
  return `rgba(${r},${g},${b},${a})`;
}

export function rollTraits(teams, rng) {
  const team = teams[Math.floor(rng() * teams.length)];
  const jerseyType = rng() > 0.5 ? "Home" : "Away";
  const primary = jerseyType === "Home" ? team.home : team.away;
  const secondary = jerseyType === "Home" ? team.away : team.home;
  const r = rng();
  let rarity;
  if (r < 0.01) rarity = "Legendary";
  else if (r < 0.07) rarity = "Epic";
  else if (r < 0.19) rarity = "Rare";
  else if (r < 0.46) rarity = "Uncommon";
  else rarity = "Common";

  const pattern = weightedRandom(PATTERNS, rng);
  const number = String(Math.floor(1 + rng() * 99)).padStart(2, "0");

  return {
    team: team.name,
    jerseyType,
    primary,
    secondary,
    pattern,
    rarity,
    number,
  };
}

function drawStripesSoft(ctx, w, h, secondaryRgb, rng) {
  const y1 = 160 + Math.floor(rng() * 40);
  const y2 = 260 + Math.floor(rng() * 50);
  ctx.fillStyle = rgbStr(secondaryRgb, 0.18);
  ctx.fillRect(0, y1, w, 36 + Math.floor(rng() * 20));
  ctx.fillRect(0, y2, w, 36 + Math.floor(rng() * 20));
}

function drawStripesBold(ctx, w, h, secondaryRgb, rng) {
  const count = 4 + Math.floor(rng() * 2);
  let y = 120 + Math.floor(rng() * 30);
  for (let i = 0; i < count; i++) {
    const bh = 22 + Math.floor(rng() * 18);
    ctx.fillStyle = rgbStr(secondaryRgb, 0.5 + rng() * 0.25);
    ctx.fillRect(0, y, w, bh);
    y += bh + 18 + Math.floor(rng() * 20);
    if (y > h - 80) break;
  }
}

function drawCamo(ctx, w, h, baseRgb, rng) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 14; i++) {
    const dx = rng() * w;
    const dy = rng() * h;
    const rw = 40 + rng() * 120;
    const rh = 30 + rng() * 90;
    const tint = rng() > 0.5 ? 1.15 : 0.75;
    ctx.fillStyle = rgbStr(
      {
        r: Math.min(255, Math.floor(baseRgb.r * tint)),
        g: Math.min(255, Math.floor(baseRgb.g * tint)),
        b: Math.min(255, Math.floor(baseRgb.b * tint)),
      },
      0.35
    );
    ctx.beginPath();
    ctx.ellipse(dx, dy, rw, rh, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNeonInnerLines(ctx, w, h, accentRgb, rarity, rng) {
  const glow = rarity === "Legendary" ? 28 : rarity === "Epic" ? 22 : 14;
  ctx.save();
  ctx.strokeStyle = rgbStr(accentRgb, 0.9);
  ctx.lineWidth = 2;
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = glow;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(rng() * w, rng() * h);
    ctx.lineTo(rng() * w, rng() * h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeonFrame(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 10;
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 28;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.restore();
}

function drawGlitchSlices(ctx, source, w, h, rng) {
  const strips = 10 + Math.floor(rng() * 8);
  const sh = Math.max(8, Math.floor(h / strips));
  for (let y = 0; y < h; y += sh) {
    const sliceH = Math.min(sh, h - y);
    const offset = Math.floor((rng() - 0.5) * 24);
    ctx.drawImage(source, 0, y, w, sliceH, offset, y, w, sliceH);
  }
}

function drawGlitchNoise(ctx, w, h, rng) {
  ctx.save();
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = "rgba(255,0,255,0.85)";
    ctx.fillRect(rng() * w, rng() * h, 50, 5);
  }
  ctx.restore();
}

function drawJerseyShape(ctx, w, h, primaryRgb) {
  const cx = w / 2;
  ctx.fillStyle = rgbStr(primaryRgb, 1);
  ctx.beginPath();
  ctx.moveTo(cx - 120, 80);
  ctx.lineTo(cx + 120, 80);
  ctx.lineTo(cx + 140, 140);
  ctx.lineTo(cx + 130, h - 40);
  ctx.lineTo(cx - 130, h - 40);
  ctx.lineTo(cx - 140, 140);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgbStr(primaryRgb, 0.92);
  ctx.beginPath();
  ctx.moveTo(cx - 35, 80);
  ctx.lineTo(cx + 35, 80);
  ctx.lineTo(cx + 20, 155);
  ctx.lineTo(cx - 20, 155);
  ctx.closePath();
  ctx.fill();
}

function paintJersey(ctx, w, h, traits, rng, patternDraw) {
  const primaryRgb = hexToRgb(traits.primary);
  const secondaryRgb = hexToRgb(traits.secondary);
  const pat = patternDraw || traits.pattern;

  ctx.fillStyle = "#07080f";
  ctx.fillRect(0, 0, w, h);

  drawJerseyShape(ctx, w, h, primaryRgb);

  if (pat === "Stripe") {
    drawStripesBold(ctx, w, h, secondaryRgb, rng);
  } else {
    drawStripesSoft(ctx, w, h, secondaryRgb, rng);
  }

  if (pat === "Camo") {
    drawCamo(ctx, w, h, primaryRgb, rng);
  } else if (pat === "Clean") {
    ctx.strokeStyle = rgbStr(secondaryRgb, 0.28);
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.18, h * 0.22, w * 0.64, h * 0.58);
  }

  ctx.save();
  ctx.font = `800 ${Math.floor(h * 0.16)}px Outfit, Arial Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = rgbStr(secondaryRgb, 0.92);
  ctx.fillText(traits.number, w / 2, h * 0.48);
  ctx.restore();

  if (pat === "Neon") {
    drawNeonFrame(ctx, w, h);
    drawNeonInnerLines(ctx, w, h, secondaryRgb, traits.rarity, rng);
  }

  ctx.save();
  ctx.font = `600 12px Outfit, Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("ICE LEAGUE", w / 2, h - 36);
  ctx.font = `600 10px Outfit, Arial, sans-serif`;
  ctx.fillStyle = "rgba(0,255,255,0.35)";
  ctx.fillText("DIGITAL JERSEY UNIVERSE", w / 2, h - 18);
  ctx.restore();
}

export function renderJersey(canvas, traits, rng, createOffscreen) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");

  if (traits.pattern === "Glitch") {
    if (!createOffscreen) {
      paintJersey(ctx, w, h, traits, rng, "Clean");
      return;
    }
    const base = createOffscreen(w, h);
    paintJersey(base.getContext("2d"), w, h, traits, rng, "Stripe");
    ctx.fillStyle = "#07080f";
    ctx.fillRect(0, 0, w, h);
    drawGlitchSlices(ctx, base, w, h, rng);
    drawGlitchNoise(ctx, w, h, rng);
    drawNeonFrame(ctx, w, h);
    ctx.save();
    ctx.font = `800 ${Math.floor(h * 0.16)}px Outfit, Arial Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = rgbStr(hexToRgb(traits.secondary), 0.9);
    ctx.shadowColor = "rgba(255,0,255,0.5)";
    ctx.shadowBlur = 14;
    ctx.fillText(traits.number, w / 2, h * 0.48);
    ctx.restore();
    ctx.save();
    ctx.font = `600 12px Outfit, Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("ICE LEAGUE", w / 2, h - 36);
    ctx.font = `600 10px Outfit, Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,0,255,0.45)";
    ctx.fillText("DIGITAL JERSEY UNIVERSE", w / 2, h - 18);
    ctx.restore();
    return;
  }

  paintJersey(ctx, w, h, traits, rng, traits.pattern);
}

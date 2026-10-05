#!/usr/bin/env node
/**
 * mockup-placement-check.mjs — draw the calibrated print rect over a blank mockup.
 *
 * Read-only audit helper for the mockup assets. It never edits placements.json.
 *
 * Usage:
 *   node scripts/mockup-placement-check.mjs --product tshirt --color white [--image candidate.png] [--out out.png]
 *   node scripts/mockup-placement-check.mjs --all [--outDir ../phase2/mockup-overlays]
 *
 * Options:
 *   --product   tshirt | hoodie | mug | card   (from lib/mockups/placements.json)
 *               gcard                          (virtual: GreetingCardMockup.tsx hard-coded boxes, colors uk|us)
 *   --color     white | blue | black | uk | us  (default white)
 *   --image     candidate image to check instead of the entry's baseMockupSrc under public/
 *   --out       overlay PNG path (default: <outDir>/<product>-<color>.png)
 *   --outDir    directory for overlays (default ../phase2/mockup-overlays relative to repo root)
 *   --artRatio  width/height of a sample design to draw the contain-fitted artwork box (default 1)
 *   --stroke    stroke width in px (default 2)
 *   --tolerance aspect tolerance in percent (default 0.3)
 *   --all       run every entry (placements.json + gcard/uk + gcard/us)
 *   --json-only skip writing overlays (summary lines only)
 *
 * Prints one JSON summary line per entry. Exit code 1 if any aspect delta > tolerance,
 * exit code 2 for usage / missing-file errors.
 *
 * Geometry mirrors components/mockups/MockupStage.tsx:
 *   - the stage container has CSS aspect-ratio = entry.aspectRatio
 *   - the base image is object-contain inside the container (so if the image ratio differs
 *     from aspectRatio, the image is letterboxed and the rect shifts relative to the image)
 *   - rect: xPct/yPct = centre, wPct/hPct = size, all % of the CONTAINER
 *   - card only: artwork boundary is inset by 8% of the rect HEIGHT on all four sides
 *   - artwork is contain-fitted inside the boundary
 * The virtual "gcard" entries mirror components/mockups/GreetingCardMockup.tsx (2/3 container,
 * left/top/width/height boxes, then CSS inset:8% which is per-axis, not uniform px).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PLACEMENTS_PATH = path.join(REPO_ROOT, "lib/mockups/placements.json");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const DEFAULT_OUT_DIR = path.resolve(REPO_ROOT, "../phase2/mockup-overlays");

const TERRACOTTA = "#C2653F";
const TERRACOTTA_FILL = "rgba(194,101,63,0.18)";
const INK = "#1F1B18";

/**
 * Virtual entries that are NOT in placements.json. They mirror the hard-coded boxes in
 * components/mockups/GreetingCardMockup.tsx so the uk/us greeting-card photos can be checked too.
 * Box = { left, top, width, height } in % of the 2/3 container; the artwork sits inside CSS inset:8%.
 */
const VIRTUAL_ENTRIES = {
  gcard: {
    uk: {
      baseMockupSrc: "/mockups/premium-v2/card-uk.webp",
      aspectRatio: 2 / 3,
      source: "components/mockups/GreetingCardMockup.tsx (variant=uk)",
      placement: {
        kind: "rect",
        rect: {
          xPct: 29 + 54 / 2,
          yPct: 24 + 47 / 2,
          wPct: 54,
          hPct: 47,
          rotateDeg: 0,
          borderRadiusPct: 0,
        },
      },
      insetMode: "axis-8pct",
    },
    us: {
      baseMockupSrc: "/mockups/premium-v2/card-us.webp",
      aspectRatio: 2 / 3,
      source: "components/mockups/GreetingCardMockup.tsx (variant=us)",
      placement: {
        kind: "rect",
        rect: {
          xPct: 28 + 55 / 2,
          yPct: 22 + 51 / 2,
          wPct: 55,
          hPct: 51,
          rotateDeg: 0,
          borderRadiusPct: 0,
        },
      },
      insetMode: "axis-8pct",
    },
  },
};

// ── CLI parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    color: "white",
    artRatio: 1,
    stroke: 2,
    tolerance: 0.3,
    all: false,
    jsonOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--"))
        throw new Error(`Missing value for ${a}`);
      i += 1;
      return v;
    };
    switch (a) {
      case "--product":
        args.product = next();
        break;
      case "--color":
        args.color = next();
        break;
      case "--image":
        args.image = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--outDir":
        args.outDir = next();
        break;
      case "--artRatio":
        args.artRatio = Number(next());
        break;
      case "--stroke":
        args.stroke = Number(next());
        break;
      case "--tolerance":
        args.tolerance = Number(next());
        break;
      case "--all":
        args.all = true;
        break;
      case "--json-only":
        args.jsonOnly = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/mockup-placement-check.mjs --product tshirt --color white [--image candidate.png] [--out out.png]",
    "  node scripts/mockup-placement-check.mjs --all [--outDir ../phase2/mockup-overlays]",
    "Products: tshirt | hoodie | mug | card (placements.json), gcard (uk|us; GreetingCardMockup.tsx boxes)",
  ].join("\n");
}

// ── Geometry ──────────────────────────────────────────────────────────────────

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * The stage container has aspect `A`; the image (w×h) is object-contain inside it.
 * Returns the container size in image-pixel units and the image offset inside it.
 */
function containerGeometry(imgW, imgH, aspect) {
  const imgRatio = imgW / imgH;
  if (imgRatio >= aspect) {
    // image fills the width, letterboxed top/bottom
    const cw = imgW;
    const ch = imgW / aspect;
    return { cw, ch, offX: 0, offY: (ch - imgH) / 2 };
  }
  // image fills the height, pillarboxed left/right
  const ch = imgH;
  const cw = imgH * aspect;
  return { cw, ch, offX: (cw - imgW) / 2, offY: 0 };
}

function rectToPx(rect, geo) {
  const w = (rect.wPct / 100) * geo.cw;
  const h = (rect.hPct / 100) * geo.ch;
  const cx = (rect.xPct / 100) * geo.cw - geo.offX;
  const cy = (rect.yPct / 100) * geo.ch - geo.offY;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

function quadToPx(quad, geo) {
  const pt = (p) => ({
    x: (p.xPct / 100) * geo.cw - geo.offX,
    y: (p.yPct / 100) * geo.ch - geo.offY,
  });
  return { tl: pt(quad.tl), tr: pt(quad.tr), br: pt(quad.br), bl: pt(quad.bl) };
}

/** Mirrors lib/placement/fitArtworkToBoundary.ts (contain). */
function containFit(boundary, artRatio) {
  const bRatio = boundary.w / boundary.h;
  let w = boundary.w;
  let h = boundary.h;
  if (artRatio > bRatio) h = boundary.w / artRatio;
  else w = boundary.h * artRatio;
  return {
    x: boundary.x + (boundary.w - w) / 2,
    y: boundary.y + (boundary.h - h) / 2,
    w,
    h,
  };
}

function insetRect(rect, ix, iy) {
  return {
    x: rect.x + ix,
    y: rect.y + iy,
    w: Math.max(0, rect.w - ix * 2),
    h: Math.max(0, rect.h - iy * 2),
  };
}

function artworkBoundaryFor(product, entry, rectPx) {
  if (product === "card") {
    // MockupStage.tsx: inset by 8% of boundary.h on all sides (uniform pixel border)
    return insetRect(rectPx, rectPx.h * 0.08, rectPx.h * 0.08);
  }
  if (entry.insetMode === "axis-8pct") {
    // GreetingCardMockup.tsx: CSS inset:8% → 8% of width horizontally, 8% of height vertically
    return insetRect(rectPx, rectPx.w * 0.08, rectPx.h * 0.08);
  }
  return null;
}

// ── SVG overlay ───────────────────────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSvg({
  imgW,
  imgH,
  stroke,
  rectPx,
  rotateDeg,
  radiusPct,
  quadPx,
  insetPx,
  artPx,
  captionLines,
  letterbox,
}) {
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}" viewBox="0 0 ${imgW} ${imgH}">`,
  );

  // Letterbox (only when the image ratio != container ratio): show the part of the container that is off-image
  if (letterbox && (letterbox.offX > 0.5 || letterbox.offY > 0.5)) {
    parts.push(
      `<rect x="0" y="0" width="${imgW}" height="${imgH}" fill="none" stroke="#3B82F6" stroke-width="${stroke}" stroke-dasharray="${stroke * 4} ${stroke * 3}" />`,
    );
  }

  if (rectPx) {
    const rx = ((radiusPct ?? 0) / 100) * rectPx.w;
    const ry = ((radiusPct ?? 0) / 100) * rectPx.h;
    const transform = rotateDeg
      ? ` transform="rotate(${rotateDeg} ${rectPx.cx} ${rectPx.cy})"`
      : "";
    parts.push(
      `<rect x="${rectPx.x}" y="${rectPx.y}" width="${rectPx.w}" height="${rectPx.h}" rx="${rx}" ry="${ry}" fill="${TERRACOTTA_FILL}" stroke="${TERRACOTTA}" stroke-width="${stroke}"${transform} />`,
    );
    if (insetPx) {
      parts.push(
        `<rect x="${insetPx.x}" y="${insetPx.y}" width="${insetPx.w}" height="${insetPx.h}" fill="none" stroke="${TERRACOTTA}" stroke-width="${stroke}" stroke-dasharray="${stroke * 5} ${stroke * 3}"${transform} />`,
      );
    }
    if (artPx) {
      parts.push(
        `<rect x="${artPx.x}" y="${artPx.y}" width="${artPx.w}" height="${artPx.h}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="${Math.max(1, stroke - 1)}" stroke-dasharray="${stroke * 2} ${stroke * 2}"${transform} />`,
      );
    }
    // Crosshair at rect centre
    const arm = Math.max(12, Math.min(rectPx.w, rectPx.h) * 0.12);
    parts.push(
      `<line x1="${rectPx.cx - arm}" y1="${rectPx.cy}" x2="${rectPx.cx + arm}" y2="${rectPx.cy}" stroke="${TERRACOTTA}" stroke-width="${stroke}" />`,
    );
    parts.push(
      `<line x1="${rectPx.cx}" y1="${rectPx.cy - arm}" x2="${rectPx.cx}" y2="${rectPx.cy + arm}" stroke="${TERRACOTTA}" stroke-width="${stroke}" />`,
    );
    parts.push(
      `<circle cx="${rectPx.cx}" cy="${rectPx.cy}" r="${stroke * 1.5}" fill="${TERRACOTTA}" />`,
    );
  }

  if (quadPx) {
    const pts = [quadPx.tl, quadPx.tr, quadPx.br, quadPx.bl]
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
    parts.push(
      `<polygon points="${pts}" fill="${TERRACOTTA_FILL}" stroke="${TERRACOTTA}" stroke-width="${stroke}" />`,
    );
    const cx = (quadPx.tl.x + quadPx.tr.x + quadPx.br.x + quadPx.bl.x) / 4;
    const cy = (quadPx.tl.y + quadPx.tr.y + quadPx.br.y + quadPx.bl.y) / 4;
    const arm = 14;
    parts.push(
      `<line x1="${cx - arm}" y1="${cy}" x2="${cx + arm}" y2="${cy}" stroke="${TERRACOTTA}" stroke-width="${stroke}" />`,
    );
    parts.push(
      `<line x1="${cx}" y1="${cy - arm}" x2="${cx}" y2="${cy + arm}" stroke="${TERRACOTTA}" stroke-width="${stroke}" />`,
    );
    for (const [k, p] of Object.entries(quadPx)) {
      parts.push(
        `<circle cx="${p.x}" cy="${p.y}" r="${stroke * 2}" fill="${TERRACOTTA}" />`,
      );
      parts.push(
        `<text x="${p.x + 6}" y="${p.y - 6}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.max(11, imgW / 120)}" fill="${INK}">${k}</text>`,
      );
    }
  }

  // Caption box (top-left)
  const fontSize = Math.max(12, Math.round(imgW / 95));
  const lineH = Math.round(fontSize * 1.35);
  const pad = Math.round(fontSize * 0.7);
  const longest = Math.max(...captionLines.map((l) => l.length));
  const boxW = Math.round(longest * fontSize * 0.56) + pad * 2;
  const boxH = captionLines.length * lineH + pad * 2;
  parts.push(
    `<rect x="${pad}" y="${pad}" width="${boxW}" height="${boxH}" rx="${pad / 2}" fill="rgba(255,255,255,0.86)" stroke="${TERRACOTTA}" stroke-width="1" />`,
  );
  captionLines.forEach((line, i) => {
    parts.push(
      `<text x="${pad * 2}" y="${pad + lineH * (i + 1)}" font-family="Menlo, Consolas, monospace" font-size="${fontSize}" fill="${INK}">${esc(line)}</text>`,
    );
  });

  parts.push("</svg>");
  return parts.join("\n");
}

// ── Main per-entry check ──────────────────────────────────────────────────────

async function loadPlacements() {
  const raw = await fs.readFile(PLACEMENTS_PATH, "utf8");
  return JSON.parse(raw);
}

function resolveEntry(map, product, color) {
  if (VIRTUAL_ENTRIES[product]) {
    const e = VIRTUAL_ENTRIES[product][color];
    if (!e)
      throw new Error(
        `Unknown color "${color}" for virtual product "${product}" (uk|us)`,
      );
    return e;
  }
  const byProduct = map[product];
  if (!byProduct)
    throw new Error(`Unknown product "${product}" in placements.json`);
  const entry = byProduct[color];
  if (!entry)
    throw new Error(`No placement for ${product}/${color} in placements.json`);
  return entry;
}

async function checkEntry({
  product,
  color,
  entry,
  imagePath,
  outPath,
  artRatio,
  stroke,
  tolerance,
  jsonOnly,
}) {
  const meta = await sharp(imagePath).metadata();
  const imgW = meta.width;
  const imgH = meta.height;
  if (!imgW || !imgH)
    throw new Error(`Could not read dimensions of ${imagePath}`);

  const imageAspect = imgW / imgH;
  const expectedAspect = entry.aspectRatio;
  const deltaPct =
    (Math.abs(imageAspect - expectedAspect) / expectedAspect) * 100;
  const aspectOk = deltaPct <= tolerance;

  const geo = containerGeometry(imgW, imgH, expectedAspect);
  const summary = {
    product,
    color,
    image: path.relative(REPO_ROOT, imagePath),
    width: imgW,
    height: imgH,
    format: meta.format,
    hasAlpha: Boolean(meta.hasAlpha),
    bytes: (await fs.stat(imagePath)).size,
    imageAspect: Number(imageAspect.toFixed(4)),
    expectedAspect: Number(expectedAspect.toFixed(4)),
    aspectDeltaPct: Number(deltaPct.toFixed(3)),
    aspectOk,
    letterboxPx: { x: r2(geo.offX), y: r2(geo.offY) },
    placementKind: entry.placement.kind,
  };
  if (entry.source) summary.source = entry.source;

  let rectPx = null;
  let quadPx = null;
  let insetPx = null;
  let artPx = null;
  let rotateDeg = 0;
  let radiusPct = 0;
  const captionLines = [
    `${product}/${color}  ${imgW}x${imgH}  ratio ${imageAspect.toFixed(4)} vs ${expectedAspect.toFixed(4)} (Δ ${deltaPct.toFixed(2)}%${aspectOk ? "" : "  !! OVER TOLERANCE"})`,
  ];

  if (entry.placement.kind === "rect") {
    const rect = entry.placement.rect;
    rotateDeg = rect.rotateDeg ?? 0;
    radiusPct = rect.borderRadiusPct ?? 0;
    rectPx = rectToPx(rect, geo);
    const boundary = artworkBoundaryFor(product, entry, rectPx);
    insetPx = boundary;
    artPx = containFit(boundary ?? rectPx, artRatio);
    summary.rectPct = {
      xPct: rect.xPct,
      yPct: rect.yPct,
      wPct: rect.wPct,
      hPct: rect.hPct,
      rotateDeg,
      borderRadiusPct: radiusPct,
    };
    summary.rectPx = {
      x: r2(rectPx.x),
      y: r2(rectPx.y),
      w: r2(rectPx.w),
      h: r2(rectPx.h),
      cx: r2(rectPx.cx),
      cy: r2(rectPx.cy),
      aspect: Number((rectPx.w / rectPx.h).toFixed(4)),
    };
    if (insetPx) {
      summary.artworkBoundaryPx = {
        x: r2(insetPx.x),
        y: r2(insetPx.y),
        w: r2(insetPx.w),
        h: r2(insetPx.h),
        aspect: Number((insetPx.w / insetPx.h).toFixed(4)),
      };
    }
    summary.sampleArtworkPx = {
      artRatio,
      x: r2(artPx.x),
      y: r2(artPx.y),
      w: r2(artPx.w),
      h: r2(artPx.h),
    };
    captionLines.push(
      `rect centre (${rect.xPct}%, ${rect.yPct}%) size ${rect.wPct}% x ${rect.hPct}%  rot ${rotateDeg}  radius ${radiusPct}%`,
    );
    captionLines.push(
      `rect px: x ${r2(rectPx.x)} y ${r2(rectPx.y)} w ${r2(rectPx.w)} h ${r2(rectPx.h)}  (w/h ${(rectPx.w / rectPx.h).toFixed(3)})`,
    );
    if (insetPx)
      captionLines.push(
        `artwork boundary (dashed): w ${r2(insetPx.w)} h ${r2(insetPx.h)}  (w/h ${(insetPx.w / insetPx.h).toFixed(3)})`,
      );
    captionLines.push(
      `sample artwork ${artRatio}:1 contain (white dashed): w ${r2(artPx.w)} h ${r2(artPx.h)}`,
    );
  } else if (entry.placement.kind === "quad") {
    quadPx = quadToPx(entry.placement.quad, geo);
    summary.quadPx = Object.fromEntries(
      Object.entries(quadPx).map(([k, p]) => [k, { x: r2(p.x), y: r2(p.y) }]),
    );
    captionLines.push(
      `quad tl(${quadPx.tl.x.toFixed(0)},${quadPx.tl.y.toFixed(0)}) tr(${quadPx.tr.x.toFixed(0)},${quadPx.tr.y.toFixed(0)}) br(${quadPx.br.x.toFixed(0)},${quadPx.br.y.toFixed(0)}) bl(${quadPx.bl.x.toFixed(0)},${quadPx.bl.y.toFixed(0)})`,
    );
  } else {
    throw new Error(`Unsupported placement kind: ${entry.placement.kind}`);
  }
  if (geo.offX > 0.5 || geo.offY > 0.5) {
    captionLines.push(
      `letterbox: image is offset (${r2(geo.offX)}, ${r2(geo.offY)}) px inside the ${expectedAspect.toFixed(4)} container (blue dashed = image edge)`,
    );
  }

  if (!jsonOnly) {
    const svg = buildSvg({
      imgW,
      imgH,
      stroke,
      rectPx,
      rotateDeg,
      radiusPct,
      quadPx,
      insetPx,
      artPx,
      captionLines,
      letterbox: geo,
    });
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await sharp(imagePath)
      .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    summary.overlay = path.relative(REPO_ROOT, outPath);
  }

  return summary;
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error(usage());
    process.exit(2);
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.all && !args.product) {
    console.error(usage());
    process.exit(2);
  }

  const map = await loadPlacements();
  const outDir = args.outDir
    ? path.resolve(process.cwd(), args.outDir)
    : DEFAULT_OUT_DIR;

  const jobs = [];
  if (args.all) {
    for (const [product, colors] of Object.entries(map)) {
      for (const color of Object.keys(colors)) jobs.push({ product, color });
    }
    for (const [product, colors] of Object.entries(VIRTUAL_ENTRIES)) {
      for (const color of Object.keys(colors)) jobs.push({ product, color });
    }
  } else {
    jobs.push({ product: args.product, color: args.color });
  }

  let failed = false;
  for (const job of jobs) {
    try {
      const entry = resolveEntry(map, job.product, job.color);
      const imagePath =
        args.image && !args.all
          ? path.resolve(process.cwd(), args.image)
          : path.join(PUBLIC_DIR, entry.baseMockupSrc.replace(/^\//, ""));
      await fs.access(imagePath);
      const outPath =
        args.out && !args.all
          ? path.resolve(process.cwd(), args.out)
          : path.join(outDir, `${job.product}-${job.color}.png`);
      const summary = await checkEntry({
        product: job.product,
        color: job.color,
        entry,
        imagePath,
        outPath,
        artRatio: args.artRatio,
        stroke: args.stroke,
        tolerance: args.tolerance,
        jsonOnly: args.jsonOnly,
      });
      console.log(JSON.stringify(summary));
      if (!summary.aspectOk) {
        console.error(
          `WARN ${job.product}/${job.color}: aspect ${summary.imageAspect} differs from placements.json ${summary.expectedAspect} by ${summary.aspectDeltaPct}% (> ${args.tolerance}%)`,
        );
        failed = true;
      }
    } catch (err) {
      console.error(`ERROR ${job.product}/${job.color}: ${err.message}`);
      process.exitCode = 2;
      return;
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});

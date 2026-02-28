"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import PerspT from "perspective-transform";
import {
  placements as seedPlacements,
  type MockupColor,
  type MockupProductType,
  type PlacementMap,
  type PlacementRect,
  type PlacementQuad,
} from "@/lib/mockups/placements";

type DragState =
  | { type: "rect-move"; offsetXPct: number; offsetYPct: number }
  | { type: "rect-resize"; handle: "nw" | "ne" | "se" | "sw" }
  | { type: "quad-point"; point: keyof PlacementQuad };

const TEST_ART_DEFAULT = "/mockup-previews/preview-tee-white.png";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function toPercent(clientX: number, clientY: number, rect: DOMRect) {
  const xPct = clampPct(((clientX - rect.left) / rect.width) * 100);
  const yPct = clampPct(((clientY - rect.top) / rect.height) * 100);
  return { xPct, yPct };
}

export default function MockupCalibrationPage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_MOCKUP_ADMIN === "1" || process.env.NODE_ENV !== "production";
  const [map, setMap] = useState<PlacementMap>(() => deepClone(seedPlacements));
  const [productType, setProductType] = useState<MockupProductType>("tshirt");
  const [color, setColor] = useState<MockupColor>("white");
  const [testArt, setTestArt] = useState<string>(TEST_ART_DEFAULT);
  const [adminKey, setAdminKey] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const entry = (map[productType]?.[color] || map[productType]?.white)!;
  const availableColors = useMemo(() => Object.keys(map[productType] || {}) as MockupColor[], [map, productType]);

  const quadMatrix = useMemo(() => {
    if (entry.placement.kind !== "quad") return null;
    const node = containerRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const q = entry.placement.quad;
    const srcW = 1000;
    const srcH = 1000;
    const srcPts = [0, 0, srcW, 0, srcW, srcH, 0, srcH];
    const dstPts = [
      (q.tl.xPct / 100) * rect.width,
      (q.tl.yPct / 100) * rect.height,
      (q.tr.xPct / 100) * rect.width,
      (q.tr.yPct / 100) * rect.height,
      (q.br.xPct / 100) * rect.width,
      (q.br.yPct / 100) * rect.height,
      (q.bl.xPct / 100) * rect.width,
      (q.bl.yPct / 100) * rect.height,
    ];
    const t = PerspT(srcPts, dstPts);
    const c = t.coeffs;
    if (!Array.isArray(c) || c.length < 9) return null;
    return `matrix3d(${c[0]},${c[3]},0,${c[6]},${c[1]},${c[4]},0,${c[7]},0,0,1,0,${c[2]},${c[5]},0,1)`;
  }, [entry]);

  const rectPlacement = entry.placement.kind === "rect" ? entry.placement.rect : null;
  const quadPlacement = entry.placement.kind === "quad" ? entry.placement.quad : null;

  const setRect = (next: PlacementRect) => {
    setMap((prev) => {
      const copy = deepClone(prev);
      const target = copy[productType]?.[color] || copy[productType]?.white;
      if (!target || target.placement.kind !== "rect") return prev;
      target.placement.rect = next;
      return copy;
    });
  };

  const setQuad = (next: PlacementQuad) => {
    setMap((prev) => {
      const copy = deepClone(prev);
      const target = copy[productType]?.[color] || copy[productType]?.white;
      if (!target || target.placement.kind !== "quad") return prev;
      target.placement.quad = next;
      return copy;
    });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;

    if (rectPlacement) {
      const start = toPercent(event.clientX, event.clientY, box);
      setDragState({
        type: "rect-move",
        offsetXPct: start.xPct - rectPlacement.xPct,
        offsetYPct: start.yPct - rectPlacement.yPct,
      });
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragState) return;
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const point = toPercent(event.clientX, event.clientY, box);

    if (dragState.type === "rect-move" && rectPlacement) {
      setRect({
        ...rectPlacement,
        xPct: clampPct(point.xPct - dragState.offsetXPct),
        yPct: clampPct(point.yPct - dragState.offsetYPct),
      });
      return;
    }

    if (dragState.type === "rect-resize" && rectPlacement) {
      const left = rectPlacement.xPct - rectPlacement.wPct / 2;
      const top = rectPlacement.yPct - rectPlacement.hPct / 2;
      const right = rectPlacement.xPct + rectPlacement.wPct / 2;
      const bottom = rectPlacement.yPct + rectPlacement.hPct / 2;

      let nextLeft = left;
      let nextTop = top;
      let nextRight = right;
      let nextBottom = bottom;

      if (dragState.handle === "nw") {
        nextLeft = point.xPct;
        nextTop = point.yPct;
      } else if (dragState.handle === "ne") {
        nextRight = point.xPct;
        nextTop = point.yPct;
      } else if (dragState.handle === "se") {
        nextRight = point.xPct;
        nextBottom = point.yPct;
      } else {
        nextLeft = point.xPct;
        nextBottom = point.yPct;
      }

      const width = Math.max(2, nextRight - nextLeft);
      const height = Math.max(2, nextBottom - nextTop);
      setRect({
        ...rectPlacement,
        xPct: clampPct(nextLeft + width / 2),
        yPct: clampPct(nextTop + height / 2),
        wPct: width,
        hPct: height,
      });
      return;
    }

    if (dragState.type === "quad-point" && quadPlacement) {
      setQuad({
        ...quadPlacement,
        [dragState.point]: {
          xPct: point.xPct,
          yPct: point.yPct,
        },
      });
    }
  };

  const onPointerUp = () => {
    setDragState(null);
  };

  const onUploadTestArt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setTestArt(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const saveDefaults = async () => {
    setSaveMessage(null);
    const res = await fetch("/api/admin/mockup-placements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ placements: map }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setSaveMessage(json.error || "Failed to save.");
      return;
    }
    setSaveMessage("Saved defaults to lib/mockups/placements.json");
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(map, null, 2));
    setSaveMessage("Copied placement JSON to clipboard");
  };

  if (!enabled) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Mockup Calibration</h1>
        <p className="mt-3 text-black/70">Admin calibration is disabled. Set `NEXT_PUBLIC_ENABLE_MOCKUP_ADMIN=1`.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Mockup Calibration</h1>
      <p className="mt-2 text-black/70">
        Drag and resize print areas in percentages, then save defaults used by the live renderer.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-4 lg:col-span-4">
          <div>
            <label className="text-sm font-semibold">Product</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as MockupProductType)}
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2"
            >
              <option value="tshirt">T-shirt</option>
              <option value="hoodie">Hoodie</option>
              <option value="mug">Mug</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Color</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value as MockupColor)}
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2"
            >
              {availableColors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Test image</label>
            <input type="file" accept="image/*" onChange={onUploadTestArt} className="mt-1 w-full text-sm" />
          </div>

          {rectPlacement && (
            <>
              <h2 className="pt-2 text-sm font-black uppercase tracking-wide text-black/55">Rect placement</h2>
              {(["xPct", "yPct", "wPct", "hPct", "rotateDeg"] as const).map((field) => (
                <label key={field} className="block text-xs font-semibold text-black/65">
                  {field}
                  <input
                    type="number"
                    value={rectPlacement[field]}
                    onChange={(e) =>
                      setRect({
                        ...rectPlacement,
                        [field]: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1"
                  />
                </label>
              ))}
            </>
          )}

          {quadPlacement && (
            <>
              <h2 className="pt-2 text-sm font-black uppercase tracking-wide text-black/55">Quad corners</h2>
              {(["tl", "tr", "br", "bl"] as const).map((point) => (
                <div key={point} className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-black/65">
                    {point}.xPct
                    <input
                      type="number"
                      value={quadPlacement[point].xPct}
                      onChange={(e) =>
                        setQuad({
                          ...quadPlacement,
                          [point]: { ...quadPlacement[point], xPct: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-black/65">
                    {point}.yPct
                    <input
                      type="number"
                      value={quadPlacement[point].yPct}
                      onChange={(e) =>
                        setQuad({
                          ...quadPlacement,
                          [point]: { ...quadPlacement[point], yPct: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1"
                    />
                  </label>
                </div>
              ))}
            </>
          )}

          <label className="block text-xs font-semibold text-black/65">
            Admin key (if set)
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button onClick={saveDefaults} className="rounded-xl bg-black px-3 py-2 text-sm font-bold text-white">
              Save default
            </button>
            <button onClick={copyJson} className="rounded-xl border border-black/15 px-3 py-2 text-sm font-bold">
              Copy placement JSON
            </button>
          </div>
          {saveMessage && <p className="text-sm font-semibold text-emerald-700">{saveMessage}</p>}
        </section>

        <section className="lg:col-span-8">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-3xl border border-black/10 bg-[#F5F5F6]"
            style={{ aspectRatio: `${entry.aspectRatio}` }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <Image src={entry.baseMockupSrc} alt="base mockup" fill className="object-cover" />

            {entry.placement.kind === "rect" && (
              <>
                <Image
                  src={testArt}
                  alt="test art"
                  width={1000}
                  height={1000}
                  unoptimized
                  className="absolute cursor-move object-cover"
                  style={{
                    left: `${entry.placement.rect.xPct}%`,
                    top: `${entry.placement.rect.yPct}%`,
                    width: `${entry.placement.rect.wPct}%`,
                    height: `${entry.placement.rect.hPct}%`,
                    transform: `translate(-50%,-50%) rotate(${entry.placement.rect.rotateDeg}deg)`,
                    borderRadius: `${entry.placement.rect.borderRadiusPct ?? 0}%`,
                    opacity: entry.opacity ?? 0.96,
                    mixBlendMode: productType === "mug" ? "normal" : "multiply",
                  }}
                  onPointerDown={onPointerDown}
                />
                {(["nw", "ne", "se", "sw"] as const).map((handle) => {
                  const r = rectPlacement;
                  if (!r) return null;
                  const left = r.xPct - r.wPct / 2;
                  const top = r.yPct - r.hPct / 2;
                  const right = r.xPct + r.wPct / 2;
                  const bottom = r.yPct + r.hPct / 2;
                  const x = handle.includes("w") ? left : right;
                  const y = handle.includes("n") ? top : bottom;
                  return (
                    <button
                      key={handle}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDragState({ type: "rect-resize", handle });
                      }}
                      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    />
                  );
                })}
              </>
            )}

            {entry.placement.kind === "quad" && quadMatrix && (
              <>
                <Image
                  src={testArt}
                  alt="test art"
                  width={1000}
                  height={1000}
                  unoptimized
                  className="absolute left-0 top-0 object-cover"
                  style={{
                    width: 1000,
                    height: 1000,
                    transformOrigin: "0 0",
                    transform: quadMatrix,
                    opacity: entry.opacity ?? 0.95,
                    filter: entry.dropShadow ?? "none",
                  }}
                />
                {(["tl", "tr", "br", "bl"] as const).map((point) => (
                  <button
                    key={point}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDragState({ type: "quad-point", point });
                    }}
                    className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-indigo-600"
                    style={{
                      left: `${quadPlacement?.[point].xPct ?? 0}%`,
                      top: `${quadPlacement?.[point].yPct ?? 0}%`,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

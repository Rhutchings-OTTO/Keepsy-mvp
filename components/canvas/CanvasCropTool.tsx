"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { CanvasSize } from "@/lib/canvas/sizes";

type Props = {
  /** The full generated image src (data URL or HTTPS) */
  imageSrc: string;
  /** Currently selected canvas size — determines the crop aspect ratio */
  canvasSize: CanvasSize;
  /** Called with a data URL of the cropped result + the uploaded HTTPS url */
  onConfirm: (croppedDataUrl: string, croppedHttpsUrl: string) => void;
  /** Called when user cancels without cropping */
  onCancel?: () => void;
  className?: string;
};

const MARGIN = 0.08; // canvas face occupies (1-2*MARGIN) of the container on each axis
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 5;

/**
 * Image crop tool with drag-to-pan and scroll/pinch-to-zoom.
 * Outside the print area: dimmed overlay.
 * Inside: sharp, full-colour image.
 *
 * No external libraries — pure HTML Canvas + pointer events.
 */
export function CanvasCropTool({
  imageSrc,
  canvasSize,
  onConfirm,
  onCancel,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [naturalSize, setNaturalSize] = useState({ w: 1024, h: 1024 });
  const [containerSize, setContainerSize] = useState({ w: 400, h: 400 });

  // Pan (px from center in container coords) and zoom (1 = fill print area)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pointer tracking for drag
  const dragRef = useRef<{ startPan: { x: number; y: number }; pointer: { x: number; y: number } } | null>(null);
  // Pinch tracking
  const pinchRef = useRef<{ dist: number; midPan: { x: number; y: number } } | null>(null);

  const canvasRatio = canvasSize.width / canvasSize.height;

  // Compute print area bounds in container px
  const printArea = useCallback(() => {
    const { w: cw, h: ch } = containerSize;
    let pw = cw * (1 - 2 * MARGIN);
    let ph = pw / canvasRatio;
    if (ph > ch * (1 - 2 * MARGIN)) {
      ph = ch * (1 - 2 * MARGIN);
      pw = ph * canvasRatio;
    }
    const px = (cw - pw) / 2;
    const py = (ch - ph) / 2;
    return { left: px, top: py, w: pw, h: ph };
  }, [containerSize, canvasRatio]);

  // Compute image display dimensions for current zoom
  const imageDisplay = useCallback(() => {
    const pa = printArea();
    // zoom=1 → image covers print area (cover mode)
    const baseScale = Math.max(pa.w / naturalSize.w, pa.h / naturalSize.h);
    const scale = baseScale * zoom;
    return {
      w: naturalSize.w * scale,
      h: naturalSize.h * scale,
      scale,
    };
  }, [naturalSize, zoom, printArea]);

  // Top-left of image in container coords
  const imageTopLeft = useCallback(() => {
    const { w: iw, h: ih } = imageDisplay();
    const { w: cw, h: ch } = containerSize;
    return {
      x: (cw - iw) / 2 + pan.x,
      y: (ch - ih) / 2 + pan.y,
    };
  }, [imageDisplay, containerSize, pan]);

  // Clamp pan so image always covers the print area
  const clampPan = useCallback(
    (px: number, py: number, currentZoom: number) => {
      const pa = printArea();
      const { w: cw, h: ch } = containerSize;
      const { w: naturalW, h: naturalH } = naturalSize;
      const baseScale = Math.max(pa.w / naturalW, pa.h / naturalH);
      const scale = baseScale * currentZoom;
      const iw = naturalW * scale;
      const ih = naturalH * scale;

      // Image left = (cw - iw)/2 + px. Must be ≤ pa.left for coverage.
      const maxX = pa.left - (cw - iw) / 2;
      const minX = pa.left + pa.w - iw - (cw - iw) / 2;
      const maxY = pa.top - (ch - ih) / 2;
      const minY = pa.top + pa.h - ih - (ch - ih) / 2;

      return {
        x: Math.max(minX, Math.min(maxX, px)),
        y: Math.max(minY, Math.min(maxY, py)),
      };
    },
    [containerSize, naturalSize, printArea]
  );

  // Reset pan when image or size changes
  useEffect(() => {
    setPan(clampPan(0, 0, zoom));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.code, naturalSize, containerSize]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pre-load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [imageSrc]);

  // ── Pointer events ────────────────────────────────────────────────────────

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.isPrimary) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startPan: { ...pan },
        pointer: { x: e.clientX, y: e.clientY },
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current || !e.isPrimary) return;
    const dx = e.clientX - dragRef.current.pointer.x;
    const dy = e.clientY - dragRef.current.pointer.y;
    const raw = {
      x: dragRef.current.startPan.x + dx,
      y: dragRef.current.startPan.y + dy,
    };
    setPan(clampPan(raw.x, raw.y, zoom));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Scroll wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta * prev));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  };

  // Touch pinch-to-zoom
  const activeTouches = useRef<Map<number, { x: number; y: number }>>(new Map());

  const onTouchStart = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      activeTouches.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    if (activeTouches.current.size === 2) {
      const pts = Array.from(activeTouches.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchRef.current = { dist, midPan: { ...pan } };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      activeTouches.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    const pts = Array.from(activeTouches.current.values());
    if (pts.length === 2 && pinchRef.current) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = dist / pinchRef.current.dist;
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * ratio));
        setPan((p) => clampPan(p.x, p.y, next));
        return next;
      });
      pinchRef.current.dist = dist;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      activeTouches.current.delete(t.identifier);
    }
    if (activeTouches.current.size < 2) pinchRef.current = null;
  };

  // ── Zoom controls ────────────────────────────────────────────────────────

  const adjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  };

  const resetCrop = () => {
    setZoom(1);
    setPan(clampPan(0, 0, 1));
  };

  // ── Confirm crop ─────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const pa = printArea();
      const imgTL = imageTopLeft();
      const { scale } = imageDisplay();

      // Source rect in natural image coords
      const srcX = (pa.left - imgTL.x) / scale;
      const srcY = (pa.top - imgTL.y) / scale;
      const srcW = pa.w / scale;
      const srcH = pa.h / scale;

      const OUTPUT_SIZE = 2048; // max output dimension
      const outW = canvasRatio >= 1 ? OUTPUT_SIZE : Math.round(OUTPUT_SIZE * canvasRatio);
      const outH = canvasRatio >= 1 ? Math.round(OUTPUT_SIZE / canvasRatio) : OUTPUT_SIZE;

      const offscreen = document.createElement("canvas");
      offscreen.width = outW;
      offscreen.height = outH;
      const ctx = offscreen.getContext("2d");
      if (!ctx || !imageRef.current) throw new Error("Canvas not available");

      ctx.drawImage(imageRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      const dataUrl = offscreen.toDataURL("image/jpeg", 0.92);

      // Upload to Cloudinary via API route
      const res = await fetch("/api/upload-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        // If upload fails, proceed with data URL (Printify will skip fulfillment but canvas mockup still works)
        console.warn("[crop] Upload failed, using data URL fallback:", json.error);
        onConfirm(dataUrl, dataUrl);
        return;
      }

      onConfirm(dataUrl, json.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Crop failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const pa = printArea();
  const imgTL = imageTopLeft();
  const id = imageDisplay();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* ── Instruction ──────────────────────────────────────────────────── */}
      <p className="mb-2 text-center text-xs font-semibold text-charcoal/55">
        Drag to reposition · scroll or pinch to zoom
      </p>

      {/* ── Crop stage ───────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-[#1A1614] select-none"
        style={{ aspectRatio: `${Math.max(canvasRatio, 0.6) + 0.5} / 1`, cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Blurred / dimmed image underneath (full area) */}
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: "absolute",
              width: id.w,
              height: id.h,
              left: imgTL.x,
              top: imgTL.y,
              filter: "blur(6px) brightness(0.35)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Dark overlay everywhere — box-shadow from print area creates the cutout */}
        {/* Print area window — sharp image inside */}
        <div
          style={{
            position: "absolute",
            left: pa.left,
            top: pa.top,
            width: pa.w,
            height: pa.h,
            overflow: "hidden",
            // Box-shadow creates the dim vignette outside the print area
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            borderRadius: 3,
            outline: "2px solid rgba(255,255,255,0.2)",
          }}
        >
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                position: "absolute",
                width: id.w,
                height: id.h,
                left: imgTL.x - pa.left,
                top: imgTL.y - pa.top,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Dimension label */}
        <div
          className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center"
          style={{ zIndex: 10 }}
        >
          <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white/80 backdrop-blur-sm">
            {canvasSize.width} × {canvasSize.height} in
          </span>
        </div>
      </div>

      {/* ── Zoom controls ────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => adjustZoom(-0.25)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/12 bg-white text-charcoal/60 hover:text-charcoal transition"
          aria-label="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(e) => {
            const next = parseFloat(e.target.value);
            setZoom(next);
            setPan((p) => clampPan(p.x, p.y, next));
          }}
          className="w-32 accent-terracotta"
          aria-label="Zoom level"
        />
        <button
          type="button"
          onClick={() => adjustZoom(0.25)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/12 bg-white text-charcoal/60 hover:text-charcoal transition"
          aria-label="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={resetCrop}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/12 bg-white text-charcoal/60 hover:text-charcoal transition"
          aria-label="Reset crop"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {uploadError && (
        <p className="mt-2 text-center text-xs font-semibold text-red-500">{uploadError}</p>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="mt-4 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-charcoal/12 bg-white py-3 text-sm font-bold text-charcoal/60 hover:text-charcoal transition"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isUploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(196,113,74,0.5)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-terracotta)" }}
        >
          {isUploading ? (
            "Saving…"
          ) : (
            <>
              <Check size={16} /> Confirm crop
            </>
          )}
        </button>
      </div>
    </div>
  );
}

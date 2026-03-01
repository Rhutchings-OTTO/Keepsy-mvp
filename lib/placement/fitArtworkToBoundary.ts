export type PixelRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FitMode = "contain";

export function fitArtworkToBoundary(args: {
  boundary: PixelRect;
  imageWidth: number;
  imageHeight: number;
  mode?: FitMode;
}): PixelRect {
  const { boundary, imageWidth, imageHeight } = args;
  const mode = args.mode ?? "contain";

  const safeImageW = Math.max(1, imageWidth);
  const safeImageH = Math.max(1, imageHeight);
  const safeBoundaryW = Math.max(0, boundary.w);
  const safeBoundaryH = Math.max(0, boundary.h);

  if (safeBoundaryW === 0 || safeBoundaryH === 0) {
    return { x: boundary.x, y: boundary.y, w: 0, h: 0 };
  }

  if (mode !== "contain") {
    return { x: boundary.x, y: boundary.y, w: safeBoundaryW, h: safeBoundaryH };
  }

  const imageAspect = safeImageW / safeImageH;
  const boundaryAspect = safeBoundaryW / safeBoundaryH;

  let w = safeBoundaryW;
  let h = safeBoundaryH;

  if (imageAspect > boundaryAspect) {
    h = safeBoundaryW / imageAspect;
  } else {
    w = safeBoundaryH * imageAspect;
  }

  const x = boundary.x + (safeBoundaryW - w) / 2;
  const y = boundary.y + (safeBoundaryH - h) / 2;

  return { x, y, w, h };
}


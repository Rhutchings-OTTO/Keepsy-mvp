declare module "perspective-transform" {
  export type PerspectiveTransformInstance = {
    coeffs: number[];
    coeffsInv: number[];
    transform: (x: number, y: number) => [number, number];
  };

  export default function PerspT(
    srcPts: number[],
    dstPts: number[]
  ): PerspectiveTransformInstance;
}

/**
 * Community designs for the gallery.
 * Cached at Edge so first request primes cache; subsequent users get instant response.
 */
export const runtime = "edge";
export const revalidate = 3600; // 1 hour

const COMMUNITY_DESIGNS = [
  "/occasion-tiles/christmas-scene.png",
  "/occasion-tiles/thanksgiving-cartoon.png",
  "/occasion-tiles/fourth-july-photo.png",
  "/occasion-tiles/anniversary-watercolor.png",
];

export async function GET() {
  return Response.json(
    { designs: COMMUNITY_DESIGNS },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

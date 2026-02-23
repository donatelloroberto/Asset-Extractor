import { buildApp } from "../server/app";

let appPromise: ReturnType<typeof buildApp> | null = null;

// Vercel will provide Node-compatible req/res objects.
// Using `any` avoids a hard dependency on `@vercel/node`.
export default async function handler(req: any, res: any) {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;

  // Vercel convention is /api/*, but the Express app is mounted at /
  if (req.url?.startsWith("/api")) {
    req.url = req.url.slice(4) || "/";
  }

  return app(req as any, res as any);
}

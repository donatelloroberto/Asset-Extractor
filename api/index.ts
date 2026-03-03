import { buildApp } from "../server/app.js";

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;

  if (req.url?.startsWith("/api")) {
    req.url = req.url.slice(4) || "/";
  }

  return app(req as any, res as any);
}

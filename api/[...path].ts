import { buildApp } from "../server/app.js";

process.env.SERVERLESS = "1";

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;
  return app(req as any, res as any);
}

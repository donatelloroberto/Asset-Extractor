import { createApp } from "../server/app.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let appHandler: ((req: any, res: any) => void) | null = null;

async function getHandler() {
  if (!appHandler) {
    const { app } = await createApp();
    appHandler = app;
  }
  return appHandler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const h = await getHandler();
  return h(req, res);
}

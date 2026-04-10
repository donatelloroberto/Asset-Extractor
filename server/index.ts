import { createApp } from "./app.js";
import { log } from "./log.js";

export { log };

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

(async () => {
  const { app, httpServer } = await createApp();

  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

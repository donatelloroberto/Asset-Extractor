import { createServer } from "http";
import { buildApp } from "./app";
import { log } from "./logger";

(async () => {
  try {
    const app = await buildApp();
    const httpServer = createServer(app);

    // Vite dev server (development only)
    if (process.env.NODE_ENV !== "production") {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Replit/local
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
  } catch (error) {
    // FIX: Catch fatal startup errors and exit cleanly
    console.error("Fatal error during server startup:", error);
    process.exit(1);
  }
})();

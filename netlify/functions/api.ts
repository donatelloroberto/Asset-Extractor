// If you want to use Netlify instead of Vercel, you MUST wrap Express with serverless-http
// Run: npm install serverless-http

import serverless from 'serverless-http';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';
import { createServer } from 'http';

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Initialize the routes from your backend
registerRoutes(httpServer, app).catch(err => {
  console.error("Failed to register routes:", err);
});

// Export the wrapped Express app for Netlify
export const handler = serverless(app);
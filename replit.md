# GXtapes Stremio Add-on

## Overview
A Stremio add-on converted from a Cloudstream 3 extension (GXtapes). The app serves Stremio-compatible API endpoints (manifest, catalog, meta, stream) and provides a web dashboard for monitoring and configuration.

## Architecture
- **Frontend**: React + Vite + TailwindCSS dashboard at `/`
- **Backend**: Express server serving both Stremio endpoints and API routes
- **Stremio Endpoints**: `/manifest.json`, `/catalog/:type/:id.json`, `/meta/:type/:id.json`, `/stream/:type/:id.json`
- **Dashboard API**: `/api/status`, `/api/catalogs`, `/api/catalog/:id`, `/api/meta/:id`, `/api/cache/clear`

## Key Files
- `server/stremio/manifest.ts` - Stremio manifest definition and catalog mapping
- `server/stremio/provider.ts` - Main scraping provider (catalog, search, meta, streams)
- `server/stremio/extractors.ts` - Video host extractors (88z.io, 44x.io, VID, DoodStream, GXtapes)
- `server/stremio/http.ts` - HTTP client with retries and user-agent rotation
- `server/stremio/cache.ts` - In-memory caching layer (NodeCache)
- `server/stremio/ids.ts` - ID encoding/decoding (base64url of source URLs)
- `server/routes.ts` - Express route registration
- `client/src/pages/dashboard.tsx` - Frontend dashboard
- `shared/schema.ts` - Shared TypeScript types/schemas

## Running
- `npm run dev` starts the Express server with Vite dev middleware on port 5000
- Set `DEBUG=1` environment variable for verbose logging

## ID Scheme
Content IDs use format: `gxtapes:{base64url(sourceUrl)}`

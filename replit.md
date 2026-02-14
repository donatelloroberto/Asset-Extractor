# Stremio Add-ons (GXtapes + Nurgay)

## Overview
Two Stremio add-ons converted from Cloudstream 3 extensions. The app serves Stremio-compatible API endpoints for both GXtapes and Nurgay providers, plus a unified web dashboard for monitoring and configuration.

## Architecture
- **Frontend**: React + Vite + TailwindCSS dashboard at `/`
- **Backend**: Express server serving both Stremio endpoints and API routes
- **GXtapes Stremio Endpoints**: `/manifest.json`, shared `/catalog`, `/meta`, `/stream` routes
- **Nurgay Stremio Endpoints**: `/nurgay/manifest.json`, shared `/catalog`, `/meta`, `/stream` routes
- **Dashboard API**: `/api/status`, `/api/catalogs`, `/api/catalog/:id`, `/api/meta/:id`, `/api/cache/clear`

## Key Files
### GXtapes Plugin
- `server/stremio/manifest.ts` - Stremio manifest definition and 32 catalog mappings (categories + studios)
- `server/stremio/provider.ts` - Main scraping provider (catalog, search, meta, streams)
- `server/stremio/extractors.ts` - Video host extractors (74k.io packed JS, 88z.io, 44x.io, VID, DoodStream)
- `server/stremio/http.ts` - HTTP client with retries and user-agent rotation (shared)
- `server/stremio/cache.ts` - In-memory caching layer (shared)
- `server/stremio/ids.ts` - ID encoding/decoding (base64url, prefix: `gxtapes:`)

### Nurgay Plugin
- `server/nurgay/manifest.ts` - Nurgay manifest with 40 category catalogs + search
- `server/nurgay/provider.ts` - Nurgay scraping provider (catalog, search, meta, streams)
- `server/nurgay/extractors.ts` - Video host extractors (Voe, DoodStream, StreamTape, Bigwarp, FileMoon, ListMirror)
- `server/nurgay/ids.ts` - ID encoding/decoding (base64url, prefix: `nurgay:`)

### Shared
- `server/routes.ts` - Express route registration for both add-ons
- `client/src/pages/dashboard.tsx` - Frontend dashboard showing both plugins
- `shared/schema.ts` - Shared TypeScript types/schemas

## Running
- `npm run dev` starts the Express server with Vite dev middleware on port 5000
- Set `DEBUG=1` environment variable for verbose logging

## ID Scheme
- GXtapes: `gxtapes:{base64url(sourceUrl)}`
- Nurgay: `nurgay:{base64url(sourceUrl)}`

## Video Extraction

### GXtapes Extractors
- **74k.io**: Uses packed JavaScript (eval/function(p,a,c,k,e,d)) with JWPlayer. Unpacker extracts `var links={}` containing HLS stream URLs (hls2, hls3, hls4 variants). Uses balanced parenthesis scanning + string boundary detection for robust unpacking.
- **44x.io / vi.44x.io**: Embed player with direct `src:` property containing HLS URLs
- **88z.io**: SPA with encrypted API - attempts packed script extraction, falls back to src/file patterns
- **DoodStream**: MD5 token-based URL construction
- **VID Xtapes**: Direct src extraction

### Nurgay Extractors
- **Voe.sx**: HLS extraction from `sources` object or m3u8 URL pattern
- **DoodStream / ds2video**: MD5 token-based URL construction
- **StreamTape / tapepops**: Token assembly from innerHTML assignment
- **Bigwarp**: file/src property extraction
- **FileMoon**: Packed JS unpacker for HLS URLs
- **ListMirror**: Sources array parsing, delegates to other extractors

## Domains
- GXtapes: `gay.xtapes.tw` (changed from `gay.xtapes.in`)
  - Category URLs: `/slug/` and `/{numeric-id}/`
  - Pagination: `/{category}/page/{n}/` for categories, `/page/{n}/?params` for query-based
- Nurgay: `nurgay.to`
  - WordPress RetroTube theme, `article.loop-video` for catalog items
  - Video pages: iframe in `.video-player .responsive-player`, stream links in `.notranslate a`
  - Pagination: `/{category}/page/{n}/` for categories, `/?s=query&page={n}` for search

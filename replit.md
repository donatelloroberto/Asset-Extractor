# Stremio Add-ons (9 Plugins)

## Overview
Nine Stremio add-ons: eight converted from Cloudstream 3 extensions (GXtapes, Nurgay, Fxggxt, Justthegays, BestHDgayporn, BoyfriendTV, Gaycock4U, GayStream) plus a Stash integration add-on for self-hosted media libraries. The app serves Stremio-compatible API endpoints plus a unified web dashboard for monitoring and configuration.

## Architecture
- **Frontend**: React + Vite + TailwindCSS dashboard at `/`
- **Backend**: Express server serving all Stremio endpoints and API routes
- **GXtapes Stremio Endpoints**: `/manifest.json`, shared `/catalog`, `/meta`, `/stream` routes
- **Nurgay Stremio Endpoints**: `/nurgay/manifest.json`, dedicated + shared routes
- **Fxggxt Stremio Endpoints**: `/fxggxt/manifest.json`, dedicated + shared routes
- **Justthegays Stremio Endpoints**: `/justthegays/manifest.json`, dedicated + shared routes
- **BestHDgayporn Stremio Endpoints**: `/besthdgayporn/manifest.json`, dedicated + shared routes
- **BoyfriendTV Stremio Endpoints**: `/boyfriendtv/manifest.json`, dedicated + shared routes
- **Gaycock4U Stremio Endpoints**: `/gaycock4u/manifest.json`, dedicated + shared routes
- **GayStream Stremio Endpoints**: `/gaystream/manifest.json`, dedicated + shared routes
- **Stash Stremio Endpoints**: `/stash/manifest.json` (unconfigured), `/stash/:config/manifest.json` (configured), `/stash/configure` (setup page)
- **Dashboard API**: `/api/status`, `/api/catalogs`, `/api/catalog/:id`, `/api/meta/:id`, `/api/cache/clear`

## Key Files
### GXtapes Plugin (31 catalogs)
- `server/stremio/manifest.ts` - Stremio manifest definition with 30 catalog mappings (categories + studios) + search
- `server/stremio/provider.ts` - Main scraping provider (catalog, search, meta, streams)
- `server/stremio/extractors.ts` - Video host extractors (74k.io packed JS, 88z.io, 44x.io, VID, DoodStream)
- `server/stremio/http.ts` - HTTP client with retries and user-agent rotation (shared)
- `server/stremio/cache.ts` - In-memory caching layer (shared)
- `server/stremio/ids.ts` - ID encoding/decoding (base64url, prefix: `gxtapes:`)

### Nurgay Plugin (14 catalogs)
- `server/nurgay/manifest.ts` - Nurgay manifest with 13 category catalogs + search
- `server/nurgay/provider.ts` - Nurgay scraping provider (catalog, search, meta, streams)
- `server/nurgay/extractors.ts` - Video host extractors (Voe, DoodStream, StreamTape, Bigwarp, FileMoon, ListMirror)
- `server/nurgay/ids.ts` - ID encoding/decoding (base64url, prefix: `nurgay:`)

### Fxggxt Plugin (51 catalogs)
- `server/fxggxt/manifest.ts` - Fxggxt manifest with 50 studio/tag catalogs + search
- `server/fxggxt/provider.ts` - Fxggxt scraping provider (catalog, search, meta, streams)
- `server/fxggxt/extractors.ts` - Video host extractors (VOE, DoodStream, StreamTape, FileMoon)
- `server/fxggxt/ids.ts` - ID encoding/decoding (base64url, prefix: `fxggxt:`)

### Justthegays Plugin (7 catalogs)
- `server/justthegays/manifest.ts` - Justthegays manifest with 6 category catalogs + search (note: site protected by Sucuri CloudProxy, catalog scraping may fail)
- `server/justthegays/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/justthegays/extractors.ts` - Video host extractors (direct video URL scanning)
- `server/justthegays/ids.ts` - ID encoding/decoding (base64url, prefix: `justthegays:`)

### BestHDgayporn Plugin (18 catalogs)
- `server/besthdgayporn/manifest.ts` - BestHDgayporn manifest with 17 category/tag catalogs + search
- `server/besthdgayporn/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/besthdgayporn/extractors.ts` - Video host extractors (direct video URL scanning)
- `server/besthdgayporn/ids.ts` - ID encoding/decoding (base64url, prefix: `besthdgayporn:`)

### BoyfriendTV Plugin (4 catalogs)
- `server/boyfriendtv/manifest.ts` - BoyfriendTV manifest with 3 category catalogs + search (tag/search paths blocked with 403)
- `server/boyfriendtv/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/boyfriendtv/extractors.ts` - Video host extractors (JSON sources parsing)
- `server/boyfriendtv/ids.ts` - ID encoding/decoding (base64url, prefix: `boyfriendtv:`)

### Gaycock4U Plugin (2 catalogs)
- `server/gaycock4u/manifest.ts` - Gaycock4U manifest with 1 catalog (latest) + search (video-tag pages use JS rendering, not scrapable)
- `server/gaycock4u/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/gaycock4u/extractors.ts` - Video host extractors (iframe-based with VOE, DoodStream, StreamTape, FileMoon)
- `server/gaycock4u/ids.ts` - ID encoding/decoding (base64url, prefix: `gaycock4u:`)

### GayStream Plugin (7 catalogs)
- `server/gaystream/manifest.ts` - GayStream manifest with 6 category catalogs + search
- `server/gaystream/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/gaystream/extractors.ts` - Video host extractors (iframe-based with VOE, DoodStream, StreamTape, FileMoon, Bigwarp)
- `server/gaystream/ids.ts` - ID encoding/decoding (base64url, prefix: `gaystream:`)

### Stash Plugin (6 catalogs, user-configurable)
- `server/stash/manifest.ts` - Stash manifest with config encoding/decoding (server URL + API key in base64url path)
- `server/stash/client.ts` - GraphQL client for Stash API (findScenes, findScene, getSceneStreams, getStats)
- `server/stash/provider.ts` - Stash provider (catalog, search, meta, streams) using GraphQL
- `server/stash/ids.ts` - ID encoding/decoding (prefix: `stash:`, uses scene numeric ID)

### Shared
- `server/routes.ts` - Express route registration for all nine add-ons
- `server/stremio/universal-extractor.ts` - Centralized VOE and DoodStream extractors used by all providers
- `server/stremio/stream-mapper.ts` - Maps extracted streams to Stremio format (M3U8→proxy, MP4→proxy, embed→player)
- `server/stremio/media-resolver.ts` - Resolves media URLs: detects type via URL, Content-Type headers, and content sniffing
- `client/src/pages/dashboard.tsx` - Frontend dashboard showing all nine plugins
- `shared/schema.ts` - Shared TypeScript types/schemas

## Running
- `npm run dev` starts the Express server with Vite dev middleware on port 5000
- Set `DEBUG=1` environment variable for verbose logging

## ID Scheme
- GXtapes: `gxtapes:{base64url(sourceUrl)}`
- Nurgay: `nurgay:{base64url(sourceUrl)}`
- Fxggxt: `fxggxt:{base64url(sourceUrl)}`
- Justthegays: `justthegays:{base64url(sourceUrl)}`
- BestHDgayporn: `besthdgayporn:{base64url(sourceUrl)}`
- BoyfriendTV: `boyfriendtv:{base64url(sourceUrl)}`
- Gaycock4U: `gaycock4u:{base64url(sourceUrl)}`
- GayStream: `gaystream:{base64url(sourceUrl)}`
- Stash: `stash:{sceneId}` (numeric scene ID from Stash instance)

## Video Extraction

### GXtapes Extractors
- **74k.io**: Uses packed JavaScript (eval/function(p,a,c,k,e,d)) with JWPlayer. Unpacker extracts `var links={}` containing HLS stream URLs (hls2, hls3, hls4 variants). Uses balanced parenthesis scanning + string boundary detection for robust unpacking.
- **44x.io / vi.44x.io**: Embed player with direct `src:` property containing HLS URLs
- **88z.io**: SPA with encrypted API - attempts packed script extraction, falls back to src/file patterns
- **DoodStream**: MD5 token-based URL construction
- **VID Xtapes**: Direct src extraction

### Nurgay Extractors
- **Vidoza**: Direct MP4 extraction from `sourcesCode` array or `<source>` tags. Streams proxied through `/proxy/stream` endpoint with proper Referer headers.
- **Voe.sx / Vinovo**: Anti-bot protected (Cloudflare). Falls back to `externalUrl` for browser playback.
- **DoodStream / myvidplay**: Turnstile CAPTCHA protected. Falls back to `externalUrl` for browser playback.
- **StreamTape / tapepops**: Token assembly from innerHTML assignment
- **Bigwarp**: file/src property extraction
- **FileMoon**: Packed JS unpacker for HLS URLs
- **ListMirror**: Parses dropdown `data-url` attributes to discover all mirror embed URLs, then resolves each

### Fxggxt Extractors
- **VOE**: HLS extraction from `const sources = {...}` JSON, fallback to m3u8/mp4 regex
- **DoodStream**: MD5 token-based URL construction (same as GXtapes/Nurgay)
- **StreamTape**: Token assembly from innerHTML assignment
- **FileMoon**: Packed JS unpacker for HLS URLs
- Site uses single iframe in `div.responsive-player` for video embedding

### Justthegays Extractors
- **Direct video scanning**: Regex extraction of video URLs (mp4/m3u8) from page HTML with social media URL filtering (Pinterest, Facebook, etc.)
- **Sucuri CloudProxy**: Site protected by Sucuri WAF; `fetchPage` solves JavaScript challenge cookies automatically
- **Embed fallback**: When no direct video URL found (JavaScript-rendered player), falls back to embed player (`/api/player`) for in-Stremio playback
- Videos loaded dynamically via JavaScript; server-side extraction limited

### BestHDgayporn Extractors
- **Direct video scanning**: Regex extraction of video URLs (mp4/m3u8) from page HTML
- No iframe resolution needed - videos embedded directly

### BoyfriendTV Extractors
- **JSON sources**: Parses `sources` JSON array from video page for direct MP4/HLS URLs

### Gaycock4U / GayStream Extractors
- **Iframe-based**: Resolves iframe `src` from video page, then applies appropriate extractor
- **VOE**: HLS from `const sources` JSON
- **DoodStream**: MD5 token-based URL construction
- **StreamTape**: Token assembly from innerHTML
- **FileMoon**: Packed JS unpacker
- **Bigwarp** (GayStream only): file/src property extraction

### Stash Streams
- **GraphQL API**: Queries `sceneStreams` for each scene, returning direct video URLs with mime_type and label
- **Authentication**: API key passed via `ApiKey` header or `apikey` query parameter
- **Stream types**: Direct file streams (MP4/MKV/etc), HLS transcodes, DASH transcodes — all served directly by the user's Stash instance
- **No extraction needed**: Stash provides ready-to-play stream URLs, no scraping or host resolution required
- **Configuration**: User's Stash server URL and API key encoded in base64url as part of the manifest URL path

### Stremio In-App Player (IFrameVideo Protocol)
- `/stremio-player` - Custom Stremio-compatible player frame that implements the `IFrameVideo` postMessage protocol
  - Loads HLS.js for M3U8/HLS stream playback
  - Handles MP4 direct playback via native `<video>` element
  - Handles embed player URLs via nested iframe (for sites where only embed playback works)
  - Communicates with Stremio parent via `postMessage`: `propChanged`, `propValue`, `ended`, `error`, `implementationChanged` events
  - Responds to Stremio commands: `load`, `unload`, `destroy`, `setProp`, `observeProp`
  - Reports all video properties: `paused`, `time`, `duration`, `buffering`, `buffered`, `volume`, `muted`, `playbackSpeed`
  - Keyboard shortcuts: Space/K=play/pause, Arrow keys=seek/volume, M=mute, F=fullscreen
- **Stream mapping strategy**: When `baseUrl` is available, streams that would be `notWebReady` or `externalUrl` are instead mapped to use `playerFrameUrl` pointing to `/stremio-player`. The actual stream URL is passed via `stremioPlayerUrl` property. This makes Stremio use its `IFrameVideo` implementation, which embeds the player frame inside Stremio's native player UI.
- **Result**: ALL streams play inside Stremio's player — no external browser window, no "not web ready" errors. M3U8 streams play via HLS.js, MP4 streams play via proxy, embed players render in nested iframe.

### Stream Proxy
- `/proxy/stream?url=...&referer=...` - Proxies video streams (MP4) with proper headers (Referer, User-Agent). Supports range requests for seeking. All MP4 streams are routed through this proxy when baseUrl is available, ensuring compatibility with Stremio Web player (which cannot use proxyHeaders).
- `/api/proxy/m3u8?url=...&ref=...` - Proxies HLS manifests, rewriting nested m3u8 URLs to remain within the proxy chain. Base64url-encoded parameters.
- Streams are NOT cached because URLs expire quickly (session-based tokens)

### Plex Bridge
- `server/plex/routes.ts` - Plex Media Server integration: STRM + NFO virtual library approach
  - `/plex/configure` - HTML configuration page with setup guide and library export (client-side ZIP generation using JSZip)
  - `/plex/stream/:addon/:encodedId` - Stream resolver endpoint (resolves best stream for Plex playback, returns 302 redirect)
  - `/plex/api/addons` - JSON list of available addons with catalog counts
  - `/plex/api/library/:addon` - JSON API returning catalog items for a single addon (8-way parallel catalog fetching)
  - `/plex/poster/:addon/:encodedId` - Poster image proxy (fetches from source, serves to Plex with caching)
- **Client-side ZIP generation**: The configure page loads JSZip from CDN and builds the ZIP entirely in the browser. Each addon is fetched separately via `/plex/api/library/:addon`, avoiding serverless timeout limits. Poster images downloaded through the poster proxy endpoint (same-origin, no CORS issues). Progress shown per-addon with skipped addon reporting.
- STRM files contain stream resolver URLs (no video stored); Plex fetches the URL on play, server resolves stream live
- Stream selection priority (scored): direct web-ready (4) > direct non-web-ready (3) > proxied web-ready (2) > proxied (1); embed player URLs excluded
- NFO files provide metadata (title, poster proxy URL) in Kodi-compatible XML format
- Dashboard has "Plex Bridge" button in header that opens `/plex/configure`

## Serverless Deployment
- **Vercel**: `api/index.ts` and `api/[...path].ts` wrap Express via `buildApp()`. Sets `SERVERLESS=1` env var. Config in `vercel.json` with rewrites and CORS headers. Max function duration: 30s (requires Pro plan for >10s).
- **Netlify**: `netlify/functions/api.ts` wraps Express via `serverless-http` and `buildApp()`. Sets `SERVERLESS=1` env var. Config in `netlify.toml` with redirects and headers.
- **Render**: Standard Node.js deployment using `npm run build` + `npm start`.
- **Serverless adaptations**: When `SERVERLESS=1`, HTTP fetcher uses shorter timeouts (8s vs 15s) and fewer retries (1 vs 3). Embed resolution has per-embed timeouts (6s serverless, 12s normal). Stream mapper has 8s resolve timeout. These prevent serverless function timeouts (10s Netlify, 10-30s Vercel).
- **Stream proxying on serverless**: `/proxy/stream` pipes video data which may exceed serverless timeout limits for long videos. Works for initial playback but may cut off. For reliable streaming, use a persistent server (Render, Replit, VPS).

## Domains
- GXtapes: `gay.xtapes.tw` (changed from `gay.xtapes.in`)
  - Category URLs: `/slug/` and `/{numeric-id}/`
  - Pagination: `/{category}/page/{n}/` for categories, `/page/{n}/?params` for query-based
- Nurgay: `nurgay.to`
  - WordPress RetroTube theme, `article.loop-video` for catalog items
  - Video pages: iframe in `.video-player .responsive-player`, stream links in `.notranslate a`
  - Pagination: `/{category}/page/{n}/` for categories, `/?s=query&page={n}` for search
- Fxggxt: `fxggxt.com`
  - WordPress RetroTube theme, `article.loop-video.thumb-block` for catalog items
  - Tags: `/tag/{slug}/` for tag-based categories
  - Studios: `/category/{slug}/` for studio catalogs
  - Video pages: iframe in `div.responsive-player`, schema.org VideoObject metadata
  - Pagination: `/{path}/page/{n}/` for categories, `/page/{n}/?s=query` for search
- Justthegays: `justthegays.com`
- BestHDgayporn: `besthdgayporn.com`
- BoyfriendTV: `boyfriendtv.com`
- Gaycock4U: `gaycock4u.com`
- GayStream: `gaystream.online`

# Stremio Add-ons (8 Plugins)

## Overview
Eight Stremio add-ons converted from Cloudstream 3 extensions. The app serves Stremio-compatible API endpoints for GXtapes, Nurgay, Fxggxt, Justthegays, BestHDgayporn, BoyfriendTV, Gaycock4U, and GayStream providers, plus a unified web dashboard for monitoring and configuration.

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
- **Dashboard API**: `/api/status`, `/api/catalogs`, `/api/catalog/:id`, `/api/meta/:id`, `/api/cache/clear`

## Key Files
### GXtapes Plugin (101 catalogs)
- `server/stremio/manifest.ts` - Stremio manifest definition with 90+ catalog mappings (categories + studios)
- `server/stremio/provider.ts` - Main scraping provider (catalog, search, meta, streams)
- `server/stremio/extractors.ts` - Video host extractors (74k.io packed JS, 88z.io, 44x.io, VID, DoodStream)
- `server/stremio/http.ts` - HTTP client with retries and user-agent rotation (shared)
- `server/stremio/cache.ts` - In-memory caching layer (shared)
- `server/stremio/ids.ts` - ID encoding/decoding (base64url, prefix: `gxtapes:`)

### Nurgay Plugin (41 catalogs)
- `server/nurgay/manifest.ts` - Nurgay manifest with 40 category catalogs + search
- `server/nurgay/provider.ts` - Nurgay scraping provider (catalog, search, meta, streams)
- `server/nurgay/extractors.ts` - Video host extractors (Voe, DoodStream, StreamTape, Bigwarp, FileMoon, ListMirror)
- `server/nurgay/ids.ts` - ID encoding/decoding (base64url, prefix: `nurgay:`)

### Fxggxt Plugin (139 catalogs)
- `server/fxggxt/manifest.ts` - Fxggxt manifest with 130+ studio/tag catalogs + search
- `server/fxggxt/provider.ts` - Fxggxt scraping provider (catalog, search, meta, streams)
- `server/fxggxt/extractors.ts` - Video host extractors (VOE, DoodStream, StreamTape, FileMoon)
- `server/fxggxt/ids.ts` - ID encoding/decoding (base64url, prefix: `fxggxt:`)

### Justthegays Plugin (9 catalogs)
- `server/justthegays/manifest.ts` - Justthegays manifest with 8 category catalogs + search
- `server/justthegays/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/justthegays/extractors.ts` - Video host extractors (direct video URL scanning)
- `server/justthegays/ids.ts` - ID encoding/decoding (base64url, prefix: `justthegays:`)

### BestHDgayporn Plugin (9 catalogs)
- `server/besthdgayporn/manifest.ts` - BestHDgayporn manifest with 8 category catalogs + search
- `server/besthdgayporn/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/besthdgayporn/extractors.ts` - Video host extractors (direct video URL scanning)
- `server/besthdgayporn/ids.ts` - ID encoding/decoding (base64url, prefix: `besthdgayporn:`)

### BoyfriendTV Plugin (14 catalogs)
- `server/boyfriendtv/manifest.ts` - BoyfriendTV manifest with 13 category catalogs + search
- `server/boyfriendtv/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/boyfriendtv/extractors.ts` - Video host extractors (JSON sources parsing)
- `server/boyfriendtv/ids.ts` - ID encoding/decoding (base64url, prefix: `boyfriendtv:`)

### Gaycock4U Plugin (17 catalogs)
- `server/gaycock4u/manifest.ts` - Gaycock4U manifest with 16 category catalogs + search
- `server/gaycock4u/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/gaycock4u/extractors.ts` - Video host extractors (iframe-based with VOE, DoodStream, StreamTape, FileMoon)
- `server/gaycock4u/ids.ts` - ID encoding/decoding (base64url, prefix: `gaycock4u:`)

### GayStream Plugin (18 catalogs)
- `server/gaystream/manifest.ts` - GayStream manifest with 17 category catalogs + search
- `server/gaystream/provider.ts` - Scraping provider (catalog, search, meta, streams)
- `server/gaystream/extractors.ts` - Video host extractors (iframe-based with VOE, DoodStream, StreamTape, FileMoon, Bigwarp)
- `server/gaystream/ids.ts` - ID encoding/decoding (base64url, prefix: `gaystream:`)

### Shared
- `server/routes.ts` - Express route registration for all eight add-ons
- `client/src/pages/dashboard.tsx` - Frontend dashboard showing all eight plugins
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

### BestHDgayporn / Justthegays Extractors
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

### Stream Proxy
- `/proxy/stream?url=...&referer=...` - Proxies video streams with proper headers (Referer, User-Agent). Supports range requests for seeking. Used for hosts like Vidoza where direct URLs need specific headers.
- Streams are NOT cached because URLs expire quickly (session-based tokens)

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

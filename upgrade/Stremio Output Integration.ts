import { resolveMedia } from '../resolver';
import { cacheQuery } from './cache';

/**
 * Use this wrapper inside your existing provider logic (e.g., inside getStreams for Besthdgayporn).
 * Replaces direct mapping of raw URLs to ensure proper structural formatting for Stremio playback.
 */
export async function mapOptimizedStremioResponse(req: any, rawExtractedResults: any[]) {
    // Secure schema resolution for production
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');

    const optimizedStreams = await Promise.all(rawExtractedResults.map(async (res, index) => {
        const cacheKey = `resolved_stream:${res.url}`;
        
        // Caching mapped directly via the unique URL. 
        // 30-minute TTL highly recommended to counter expiring CDN token signatures.
        const resolved = await cacheQuery(cacheKey, () => resolveMedia(res.url), 30 * 60);

        let finalUrl = resolved.url;
        let behaviorHints: any = { notWebReady: false };

        if (resolved.type === 'm3u8') {
            // Apply M3U8 Proxy wrapper to bypass ISP
            const encodedUrl = Buffer.from(resolved.url).toString('base64');
            const encodedRef = Buffer.from(resolved.referer || '').toString('base64');
            finalUrl = `${proto}://${host}/api/proxy/m3u8?url=${encodedUrl}&ref=${encodedRef}`;
        } else if (resolved.type === 'mp4') {
            // Direct MP4 mapping. Inject Hotlink bypass headers.
            behaviorHints.proxyHeaders = {
                request: {
                    'Referer': resolved.referer || res.url,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            // Set true because Stremio Web will fail CORS on pure mp4 files; forces app usage or proxy fallback.
            behaviorHints.notWebReady = true; 
        }

        return {
            title: res.title || `Source ${index + 1} • ${resolved.type.toUpperCase()}`,
            url: finalUrl,
            behaviorHints
        };
    }));

    return optimizedStreams;
}
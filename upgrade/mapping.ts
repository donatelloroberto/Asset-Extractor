import { resolveMedia } from '../resolver';
import { cacheQuery } from './cache';

/**
 * Use this wrapper inside your individual provider modules (Besthdgayporn, BoyfriendTV, etc.)
 * It guarantees all scraped links are converted into a Stremio-playable format.
 */
export async function mapOptimizedStremioResponse(req: any, rawExtractedResults: {url: string, title?: string}[]) {
    // Secure schema resolution for dynamic deployment environments
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');

    const optimizedStreams = await Promise.all(rawExtractedResults.map(async (res, index) => {
        const cacheKey = `resolved_stream:${res.url}`;
        
        // Use a 30-minute TTL (1800 seconds) to prevent CDN tokens from expiring in cache
        const resolved = await cacheQuery(cacheKey, () => resolveMedia(res.url), 1800);

        let finalUrl = resolved.url;
        let behaviorHints: any = { notWebReady: false };

        if (resolved.type === 'm3u8') {
            // Apply M3U8 Proxy wrapper to bypass ISP blocks cleanly
            const encodedUrl = Buffer.from(resolved.url).toString('base64');
            const encodedRef = Buffer.from(resolved.referer || '').toString('base64');
            finalUrl = `${proto}://${host}/api/proxy/m3u8?url=${encodedUrl}&ref=${encodedRef}`;
        } else if (resolved.type === 'mp4') {
            // Direct MP4 mapping. Inject Hotlink bypass headers for Stremio Desktop.
            behaviorHints.proxyHeaders = {
                request: {
                    'Referer': resolved.referer || res.url,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            // Set true because Stremio Web typically blocks cross-origin mp4 fetching.
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
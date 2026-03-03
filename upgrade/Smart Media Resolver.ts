export interface ResolvedStream {
    url: string;
    type: 'mp4' | 'm3u8' | 'unknown';
    referer?: string;
}

/**
 * Recursively resolves HTML pages and iframes to find the true underlying media file.
 * Avoids heavy DOM parsers to save server execution credits.
 */
export async function resolveMedia(url: string, depth = 0): Promise<ResolvedStream> {
    // Failsafe to prevent infinite iframe loops
    if (depth > 2) return { url, type: 'unknown' };
    
    // Base Case: Already a direct stream
    if (url.includes('.mp4')) return { url, type: 'mp4' };
    if (url.includes('.m3u8')) return { url, type: 'm3u8' };

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html'
            }
        });
        
        if (!res.ok) return { url, type: 'unknown' };
        const html = await res.text();

        // 1. Regex Extraction for JWPlayer / VideoJS Configurations
        // Looks for file: "https://...m3u8" or src: "..."
        const fileRegex = /(?:file|src):\s*["'](https?:\/\/[^"']+\.(mp4|m3u8)[^"']*)["']/i;
        const fileMatch = html.match(fileRegex);
        
        if (fileMatch && fileMatch[1]) {
            const finalUrl = fileMatch[1].replace(/\\/g, ''); // Clear json escape slashes
            return {
                url: finalUrl,
                type: finalUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
                referer: url
            };
        }

        // 2. Regex Extraction for standard HTML5 <source> elements
        const sourceRegex = /<source[^>]+src=["']([^"']+\.(mp4|m3u8)[^"']*)["']/i;
        const sourceMatch = html.match(sourceRegex);
        
        if (sourceMatch && sourceMatch[1]) {
            let finalUrl = sourceMatch[1];
            // Fix relative paths
            if (finalUrl.startsWith('/')) {
                const u = new URL(url);
                finalUrl = `${u.protocol}//${u.host}${finalUrl}`;
            }
            return {
                url: finalUrl,
                type: finalUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
                referer: url
            };
        }

        // 3. Look for embedded iframes (Recursive resolution)
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
        const iframeMatch = html.match(iframeRegex);
        
        if (iframeMatch && iframeMatch[1]) {
            let iframeUrl = iframeMatch[1];
            if (iframeUrl.startsWith('/')) {
                const u = new URL(url);
                iframeUrl = `${u.protocol}//${u.host}${iframeUrl}`;
            }
            return await resolveMedia(iframeUrl, depth + 1);
        }

    } catch (error) {
        console.error(`[Resolver] Network/Extraction failed for ${url}:`, error);
    }

    // Fallback: return the original URL if we couldn't parse it
    return { url, type: 'unknown' };
}
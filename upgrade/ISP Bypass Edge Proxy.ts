import { Request, Response } from 'express';

/**
 * Bypasses ISP blocks and CORS by proxying ONLY the .m3u8 manifest file (~10KB).
 * Rewrites the internal chunk URLs to stream directly from the unblocked CDNs.
 * Uses < 1% of the bandwidth of a full video proxy.
 */
export async function handleM3u8Proxy(req: Request, res: Response) {
    const targetUrl = req.query.url as string;
    const referer = req.query.ref as string;

    if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const decodedUrl = Buffer.from(targetUrl, 'base64').toString('utf-8');
        const decodedRef = referer 
            ? Buffer.from(referer, 'base64').toString('utf-8') 
            : new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: {
                'Referer': decodedRef,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Upstream failed: ${response.statusText}`);
        }

        const text = await response.text();
        const baseUrl = new URL(decodedUrl);

        // Rewrite relative chunk paths to absolute paths pointing to the origin CDN
        const rewritten = text.split('\n').map(line => {
            const tLine = line.trim();
            // Ignore headers and empty lines
            if (tLine.startsWith('#') || tLine === '') return line;
            
            try {
                // Convert relative path (e.g., 'chunk01.ts') to absolute ('https://cdn.../chunk01.ts')
                const absoluteUrl = new URL(tLine, baseUrl).toString();
                
                // If this is a master playlist pointing to quality-specific playlists, recursively proxy it
                if (absoluteUrl.includes('.m3u8')) {
                    const encodedNested = Buffer.from(absoluteUrl).toString('base64');
                    const host = req.get('host');
                    // Critical for deployment behind Vercel/Replit
                    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                    return `${proto}://${host}/api/proxy/m3u8?url=${encodedNested}&ref=${referer || ''}`;
                }
                
                // Return the direct Absolute TS chunk URL. 
                // The video payload is now served from the CDN, bypassing our server bandwidth limits.
                return absoluteUrl;
            } catch (e) {
                return line; // Fallback on failure
            }
        }).join('\n');

        // Deliver standard video headers allowing native Web / Android playback
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(rewritten);

    } catch (e) {
        console.error('[Proxy Error] M3U8 Rewrite Failed:', e);
        res.status(500).send('Internal Edge Proxy Error');
    }
}
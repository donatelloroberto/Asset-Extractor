import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import https from "https";

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

const INSECURE_HOSTS = [
  "ds2video.com",
  "d0o0d.com",
  "d-s.io",
  "doodstream.com",
  "vide0.net",
  "myvidplay.com",
  "bigwarp.io",
  "bigwarp.cc",
  "bgwp.cc",
  "vidoza.net",
  "filemoon.to",
  "filemoon.sx",
  "vinovo.to",
  "vinovo.si",
];

function needsInsecureAgent(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return INSECURE_HOSTS.some(h => hostname.includes(h));
  } catch {
    return false;
  }
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const isDebug = () => process.env.DEBUG === "1";

export async function fetchPage(url: string, options: {
  referer?: string;
  headers?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
} = {}): Promise<string> {
  const { referer, headers = {}, maxRetries = 3, timeout = 15000 } = options;

  const config: AxiosRequestConfig = {
    timeout,
    headers: {
      "User-Agent": getRandomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      ...(referer ? { Referer: referer } : {}),
      ...headers,
    },
    maxRedirects: 5,
    ...(needsInsecureAgent(url) ? { httpsAgent: insecureAgent } : {}),
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isDebug()) console.log(`[HTTP] GET ${url} (attempt ${attempt})`);
      const response: AxiosResponse = await axios.get(url, config);
      return response.data;
    } catch (err: any) {
      if (isDebug()) console.error(`[HTTP] Error on attempt ${attempt}:`, err.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${err.message}`);
      }
      await sleep(1000 * attempt);
    }
  }

  throw new Error(`Unreachable`);
}

export async function fetchText(url: string, options: {
  referer?: string;
  headers?: Record<string, string>;
} = {}): Promise<string> {
  return fetchPage(url, options);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

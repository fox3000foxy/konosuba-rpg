import { Hono } from 'hono';
import { BASE_URL } from './objects/config/constants';
import { registerApiRoutes } from './routes/api';
import { calculateGame } from './routes/game';
import { handleInteractions } from './routes/interactions';

type WorkerBindings = Record<string, string | undefined>;
const RENDER_PROXY_BASE_URL = process.env.RENDER_PROXY_BASE_URL || BASE_URL;

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function proxyRenderRequest(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = `${normalizeBaseUrl(RENDER_PROXY_BASE_URL)}${incomingUrl.pathname}${incomingUrl.search}`;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      accept: request.headers.get('accept') || '*/*',
    },
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
}

const app = new Hono();
registerApiRoutes(app);

// Render pages rely on Photon WASM runtime that is restricted on Workers.
// Proxy these routes to the Vercel deployment to keep feature parity.
app.get('/inventory/:userId', c => proxyRenderRequest(c.req.raw));
app.get('/affinity/:userId', c => proxyRenderRequest(c.req.raw));
app.get('/quest/:userId', c => proxyRenderRequest(c.req.raw));
app.get('/shop/:page', c => proxyRenderRequest(c.req.raw));
app.get('/profile/:userId', c => proxyRenderRequest(c.req.raw));
app.get('/achievements/:userId', c => proxyRenderRequest(c.req.raw));
app.get('/konosuba-rpg/:lang/*', c => proxyRenderRequest(c.req.raw));

app.get('/game/:lang/*', calculateGame);
app.post('/api/interactions', handleInteractions);

function syncBindingsToProcessEnv(bindings: WorkerBindings): void {
  if (typeof process === 'undefined' || !process.env) {
    return;
  }

  for (const [key, value] of Object.entries(bindings)) {
    if (typeof value === 'string' && value.length > 0) {
      process.env[key] = value;
    }
  }
}

export default {
  fetch(request: Request, env: WorkerBindings, ctx: unknown): Promise<Response> | Response {
    syncBindingsToProcessEnv(env);
    return app.fetch(request, env, ctx as never);
  },
};

import { Hono } from 'hono';
import { registerApiRoutes } from './routes/api';
import { calculateGame } from './routes/game';
import { handleInteractions } from './routes/interactions';
import { calculateRPG } from './routes/rpg';

type WorkerBindings = Record<string, string | undefined>;

const app = new Hono();
registerApiRoutes(app);

// WASM/Photon routes are not supported on Cloudflare Workers due to security restrictions
// These routes will return 501 Not Implemented and should be handled by Vercel instead
app.get('/inventory/:userId', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/affinity/:userId', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/quest/:userId', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/shop/:page', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/profile/:userId', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/achievements/:userId', (c) => {
  return c.text('Image rendering not available on Workers. Please use Vercel deployment.', 501);
});

app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
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

import { Hono } from 'hono';
import { registerApiRoutes } from './routes/api';
import { registerApiRenderRoutes } from './routes/apiRender';
import { calculateGame } from './routes/game';
import { handleInteractions } from './routes/interactions';
import { calculateRPG } from './routes/rpg';

type WorkerBindings = Record<string, string | undefined>;

const app = new Hono();
registerApiRoutes(app);
registerApiRenderRoutes(app);

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

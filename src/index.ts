import { config } from 'dotenv';
import { Hono } from 'hono';
import { registerApiRoutes } from './routes/api';
import { registerApiRenderRoutes } from './routes/apiRender';
import { calculateGame } from './routes/game';
import { handleInteractions } from './routes/interactions';
import { calculateRPG } from './routes/rpg';
import { startServer } from './server/bootstrap';

config();

const app = new Hono();
registerApiRoutes(app);
registerApiRenderRoutes(app);

app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
app.post('/api/interactions', handleInteractions);

export default app;

async function start() {
  await startServer(app);
}

const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
if (!isVercelRuntime) {
  start();
}

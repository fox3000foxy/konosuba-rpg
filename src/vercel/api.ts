import { config } from 'dotenv';
import { Hono } from 'hono';
import { registerApiRoutes } from '../routes/api';
import { startServer } from '../server/bootstrap';

config();

const app = new Hono();
registerApiRoutes(app);

export default app;

async function start() {
  await startServer(app);
}

const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
if (!isVercelRuntime) {
  start();
}

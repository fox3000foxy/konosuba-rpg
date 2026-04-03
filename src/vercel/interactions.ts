import { config } from 'dotenv';
import { Hono } from 'hono';
import { handleInteractions } from '../routes/interactions';
import { startServer } from '../server/bootstrap';

config();

const app = new Hono();
app.post('/api/interactions', handleInteractions);

export default app;

async function start() {
  await startServer(app);
}

const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
if (!isVercelRuntime) {
  start();
}

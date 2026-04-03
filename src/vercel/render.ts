import { config } from 'dotenv';
import { Hono } from 'hono';
import { calculateGame } from '../routes/game';
import { calculateRPG } from '../routes/rpg';
import { startServer } from '../server/bootstrap';

config();

const app = new Hono();
app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);

export default app;

async function start() {
  await startServer(app);
}

const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
if (!isVercelRuntime) {
  start();
}

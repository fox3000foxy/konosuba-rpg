import { config } from 'dotenv';
import { Hono } from 'hono';
import { calculateRPG } from './routes/rpg';

config();

const app = new Hono();
app.get('/konosuba-rpg/:lang/*', calculateRPG);

export default app;

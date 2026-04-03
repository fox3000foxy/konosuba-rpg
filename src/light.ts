import { config } from 'dotenv';
import { Hono } from 'hono';
import { registerApiRoutes } from './routes/api';
import { calculateGame } from './routes/game';

config();

const app = new Hono();

registerApiRoutes(app);
app.get('/game/:lang/*', calculateGame);

export default app;

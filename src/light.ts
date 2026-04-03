import { config } from 'dotenv';
import { Hono } from 'hono';
import { registerApiRoutes } from './routes/api';
import { calculateGameLight } from './routes/gameLight';

config();

const app = new Hono();

registerApiRoutes(app);
app.get('/game/:lang/*', calculateGameLight);

export default app;

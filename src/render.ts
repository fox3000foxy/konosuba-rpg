import { config } from 'dotenv';
import { Hono } from 'hono';
import { registerApiRenderRoutes } from './routes/apiRender';
import { calculateRPG } from './routes/rpg';

config();

const app = new Hono();

registerApiRenderRoutes(app);
app.get('/konosuba-rpg/:lang/*', calculateRPG);

export default app;

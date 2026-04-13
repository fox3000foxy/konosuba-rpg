import { config } from "dotenv";
import { Hono } from "hono";
import { registerApiRenderRoutes } from "./routes/apiRender";

config();

const app = new Hono();

registerApiRenderRoutes(app);

export default app;

import { config } from "dotenv";
import { readFileSync } from "fs";
import { type Context, Hono } from "hono";
import { registerApiRoutes } from "./routes/api";
import { registerApiRenderRoutes } from "./routes/apiRender";
import { calculateGame } from "./routes/game";
import { handleInteractions } from "./routes/interactions";
import { calculateRPG } from "./routes/rpg";
import { startServer } from "./server/bootstrap";

config();

const app = new Hono();
registerApiRoutes(app);
registerApiRenderRoutes(app);

app.get("/game/:lang/*", calculateGame);
app.get("/konosuba-rpg/:lang/*", calculateRPG);
app.post("/api/interactions", handleInteractions);
app.get("/assets/*", (c: Context) => {
  const basePath = "https://konosuba-rpg.vercel.app/";
  const data = readFileSync(process.cwd() + `/assets${c.req.path.replace("/assets", "")}`);
  if (!data) {
    return c.redirect(basePath + `assets${c.req.path.replace("/assets", "")}`);
  }
  const contentType = getContentType(c.req.path);
  c.header("Content-Type", contentType);
  return c.body(data);
});

function getContentType(path: string): string {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".otf")) return "font/otf";
  return "application/octet-stream";
}
export default app;

async function start() {
  await startServer(app);
}

const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";
if (!isVercelRuntime) {
  start();
}

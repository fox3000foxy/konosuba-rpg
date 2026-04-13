import { Hono } from "hono";
import { registerApiRoutes } from "./routes/api";
import { registerApiRenderRoutes } from "./routes/apiRender";
import { calculateGame } from "./routes/game";
import { handleInteractions } from "./routes/interactions";
import { calculateRPG } from "./routes/rpg";

type AssetFetcher = {
  fetch(input: Request | URL | string, init?: RequestInit): Promise<Response>;
};

type WorkerBindings = {
  ASSETS?: AssetFetcher;
  [key: string]: unknown;
};

const app = new Hono();
registerApiRoutes(app);
registerApiRenderRoutes(app);

app.get("/assets/*", async (c) => {
  const env = c.env as WorkerBindings;
  if (!env.ASSETS) {
    console.error("Assets binding is unavailable. Check worker configuration.");
    return c.text("Assets binding unavailable.", 500);
  }

  const url = new URL(c.req.url);
  const assetPath = url.pathname.replace(/^\/assets\/?/, "/");
  url.pathname = assetPath === "" ? "/" : assetPath;

  try {
    const response = await env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
    if (!response.ok) {
      console.warn(`Asset not found locally: ${url.pathname}. Trying fallback mirror.`);
      const mirrorUrl = `https://fox3000foxy.com/konosuba-rpg/assets${assetPath}`;
      const headers = new Headers(Object.entries(c.req.header()));
      const mirrorResponse = await fetch(mirrorUrl, { method: c.req.method, headers });
      if (!mirrorResponse.ok) {
        console.error(`Asset not found on mirror: ${mirrorUrl}. Status: ${mirrorResponse.status}`);
        return c.text(`Asset not found: ${url.pathname}`, 404);
      }
      return mirrorResponse;
    }
    return response;
  } catch (error) {
    console.error(`Error fetching asset: ${url.pathname}`, error);
    return c.text("Internal server error while fetching asset.", 500);
  }
});

app.get("/konosuba-rpg/:lang/*", calculateRPG);

app.get("/game/:lang/*", calculateGame);
app.post("/api/interactions", handleInteractions);

function syncBindingsToProcessEnv(bindings: WorkerBindings): void {
  if (typeof process === "undefined" || !process.env) {
    return;
  }

  for (const [key, value] of Object.entries(bindings)) {
    if (typeof value === "string" && value.length > 0) {
      process.env[key] = value;
    }
  }
}

export default {
  fetch(request: Request, env: WorkerBindings, ctx: unknown): Promise<Response> | Response {
    syncBindingsToProcessEnv(env);
    return app.fetch(request, env, ctx as never);
  },
};

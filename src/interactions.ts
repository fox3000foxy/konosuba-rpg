import { config } from "dotenv";
import { Hono } from "hono";
import { handleInteractions } from "./routes/interactions";

config();

const app = new Hono();

app.post("/api/interactions", handleInteractions);

export default app;

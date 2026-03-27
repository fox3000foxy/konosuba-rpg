/** Utility functions for Discord interactions */

import { verifyKey } from "discord-interactions";
import { Context } from "vm";
import { DISCORD_API_URL } from "../config/constants";
import { Interaction } from "../enums/Interaction";

export function followUpTimeout(
  interaction: Interaction,
  reponse: { type: number; data?: Record<string, unknown> },
  delay: number = 3000,
): void {
  setTimeout(() => {
    if (reponse.type === 4) {
      reponse.data = {
        content: reponse.data?.content || " ",
        embeds: reponse.data?.embeds || [],
        components: reponse.data?.components || [],
      };
    }

    // PATCH /webhooks/<application_id>/<interaction_token>/messages/@original
    fetch(
      `${DISCORD_API_URL}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reponse.data),
      },
    );
  }, delay);
}

export async function verifySignature(
  c: Context,
  body: string,
): Promise<boolean> {
  const signature = c.req.header("x-signature-ed25519");
  const timestamp = c.req.header("x-signature-timestamp");

  if (!c.env) return c.text("Environment variables not found", 500);
  const PUBLIC_KEY =
    (c.env.PUBLIC_KEY as string) ||
    "8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d";

  if (!signature || !timestamp || !PUBLIC_KEY) {
    if (!signature) console.warn("Missing signature");
    if (!timestamp) console.warn("Missing timestamp");
    if (!PUBLIC_KEY) console.warn("Missing public key");
    // return c.text('invalid request headers', 400);
    return false;
  }

  const isValid = await verifyKey(body, signature, timestamp, PUBLIC_KEY);
  if (!isValid) {
    console.warn("Invalid request signature");
    // return c.text('invalid request signature', 401);
    return false;
  }

  return true;
}

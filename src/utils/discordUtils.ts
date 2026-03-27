/** Utility functions for Discord interactions */

import { verifyKey } from "discord-interactions";
import { Context } from "vm";
import { DISCORD_API_URL } from "../config/constants";
import { Interaction } from "../enums/Interaction";

export function followUpTimeout(
  interaction: Interaction,
  response: { type: number; data?: Record<string, unknown> },
  delay: number = 3000,
): void {
  setTimeout(() => {
    if (response.type === 4) {
      response.data = {
        content: response.data?.content || " ",
        embeds: response.data?.embeds || [],
        components: response.data?.components || [],
      };
    }

    fetch(
      `${DISCORD_API_URL}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response.data),
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
  const PUBLIC_KEY =
    c.env?.PUBLIC_KEY ||
    "8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d";

  if (!signature || !timestamp || !PUBLIC_KEY) {
    console.warn("Missing required headers or public key");
    return false;
  }

  const isValid = await verifyKey(body, signature, timestamp, PUBLIC_KEY);
  if (!isValid) console.warn("Invalid request signature");

  return isValid;
}

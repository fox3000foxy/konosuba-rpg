/** Utility functions for Discord interactions */

import { verifyKey } from 'discord-interactions';
import { config } from 'dotenv';
import { Context } from 'vm';
config();

export async function verifySignature(c: Context, body: string): Promise<boolean> {
  const signature = c.req.header('x-signature-ed25519');
  const timestamp = c.req.header('x-signature-timestamp');
  const PUBLIC_KEY = process.env?.PUBLIC_KEY || '8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d';

  if (!signature || !timestamp || !PUBLIC_KEY) {
    console.warn('Missing required headers or public key');
    return false;
  }

  const isValid = await verifyKey(body, signature, timestamp, PUBLIC_KEY);
  if (!isValid) console.warn('Invalid request signature');

  return isValid;
}

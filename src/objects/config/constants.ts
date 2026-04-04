import { config } from 'dotenv';

/** Constants used throughout the application */
config();
export const DISCORD_API_URL = process.env.DISCORD_API_URL ?? 'https://discord.com/api/v10';
export const BASE_URL = process.env.BASE_URL ?? 'https://konosuba-rpg.fox3000foxy.workers.dev';

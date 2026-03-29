import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
config();

type JsonObject = Record<string, unknown>;

type DiscordCommand = {
  id: string;
  name: string;
};

type DiscordRateLimitBody = {
  retry_after?: number;
  message?: string;
  global?: boolean;
};

const OPTION_TYPE_MAP: Record<string, number> = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
};

export const applicationCommandIndex = {
  applications: [
    {
      id: process.env.DISCORD_APPLICATION_ID || '',
      name: 'KonosubaRPG',
    },
  ],
  application_commands: [],
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeOptionType(value: unknown): unknown {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  return OPTION_TYPE_MAP[value.toUpperCase()] ?? value;
}

function normalizeOption(option: unknown): unknown {
  if (!isObject(option)) {
    return option;
  }

  const normalized: JsonObject = { ...option };

  if ('type' in normalized) {
    normalized.type = normalizeOptionType(normalized.type);
  }

  if (Array.isArray(normalized.options)) {
    normalized.options = normalized.options.map(normalizeOption);
  }

  return normalized;
}

function normalizeCommand(command: unknown): JsonObject {
  if (!isObject(command)) {
    throw new Error('Invalid command format in commands.json');
  }

  const normalized: JsonObject = { ...command };

  if ('type' in normalized) {
    normalized.type = normalizeOptionType(normalized.type);
  }

  if (Array.isArray(normalized.options)) {
    normalized.options = normalized.options.map(normalizeOption);
  }

  return normalized;
}

async function loadCommands(): Promise<JsonObject[]> {
  const commandsPath = path.resolve(process.cwd(), 'commands.json');
  const content = await readFile(commandsPath, 'utf-8');
  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error('commands.json must contain an array of slash commands');
  }

  return parsed.map(normalizeCommand);
}

async function discordApi<T>(
  url: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (response.status === 429 && attempt < maxAttempts) {
      let waitMs = 1000;
      const retryAfterHeader = response.headers.get('retry-after');
      if (retryAfterHeader) {
        const seconds = Number.parseFloat(retryAfterHeader);
        if (Number.isFinite(seconds) && seconds > 0) {
          waitMs = Math.ceil(seconds * 1000);
        }
      }

      const bodyText = await response.text();
      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as DiscordRateLimitBody;
          if (
            typeof parsed.retry_after === 'number' &&
            Number.isFinite(parsed.retry_after) &&
            parsed.retry_after > 0
          ) {
            waitMs = Math.ceil(parsed.retry_after * 1000);
          }
        } catch {
          // Keep wait time from header/default when body is not JSON.
        }
      }

      // Add a small safety buffer to reduce chance of immediate re-limit.
      waitMs += 250;
      console.warn(
        `[commandsUpdater] Rate limited on ${init?.method || 'GET'} ${url}. Retrying in ${waitMs}ms (attempt ${attempt}/${maxAttempts}).`
      );
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Discord API ${response.status}: ${body}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  throw new Error('Discord API request failed after retries');
}

function getCommandsBaseUrl(applicationId: string): string {
  const base = `https://discord.com/api/v10/applications/${applicationId}`;
  return `${base}/commands`;
}

export async function patchCommands(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token) {
    throw new Error('Missing DISCORD_TOKEN');
  }

  if (!applicationId) {
    throw new Error('Missing DISCORD_APPLICATION_ID');
  }

  if (guildId) {
    console.warn(
      '[commandsUpdater] DISCORD_GUILD_ID is set but ignored. This updater patches global commands only.'
    );
  }

  const commands = await loadCommands();
  const baseUrl = getCommandsBaseUrl(applicationId);

  const existing = await discordApi<DiscordCommand[]>(baseUrl, token, {
    method: 'GET',
  });
  const existingByName = new Map(existing.map(command => [command.name, command]));

  let created = 0;
  let updated = 0;

  for (const command of commands) {
    const name = typeof command.name === 'string' ? command.name : '';
    if (!name) {
      throw new Error('Each command in commands.json must have a non-empty name');
    }

    const previous = existingByName.get(name);
    if (previous) {
      await discordApi(`${baseUrl}/${previous.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(command),
      });
      updated += 1;
      continue;
    }

    await discordApi(baseUrl, token, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    created += 1;
  }

  console.log(
    `[commandsUpdater] Synced ${commands.length} commands (${updated} updated, ${created} created) on global scope.`
  );
}

if (require.main === module) {
  patchCommands().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[commandsUpdater] Failed: ${message}`);
    process.exit(1);
  });
}

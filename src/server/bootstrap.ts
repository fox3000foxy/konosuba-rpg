import { Hono } from 'hono';

export function logEnvironmentStatus(): void {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const discordToken = process.env.DISCORD_TOKEN;
  const discordAppId = process.env.DISCORD_APPLICATION_ID;

  console.log('[startup] Environment variables status:');
  console.log(`  SUPABASE_URL: ${supabaseUrl ? '✅ set' : '❌ MISSING'}`);
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ set' : '❌ MISSING'}`
  );
  console.log(`  DISCORD_TOKEN: ${discordToken ? '✅ set' : '❌ MISSING'}`);
  console.log(
    `  DISCORD_APPLICATION_ID: ${discordAppId ? '✅ set' : '❌ MISSING'}`
  );

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[startup] ⚠️  Database progression (quests, profile, leaderboard) will NOT work without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  if (!discordToken || !discordAppId) {
    console.error(
      '[startup] ❌ Discord bot requires DISCORD_TOKEN and DISCORD_APPLICATION_ID'
    );
  }
}

export async function startServer(app: Hono): Promise<void> {
  logEnvironmentStatus();
  const serve = (await import('@hono/node-server')).serve;
  serve({ fetch: app.fetch, port: 8787 });
  console.log('Server running on http://localhost:8787');
}
import { config } from 'dotenv';
import { Context, Hono } from 'hono';
import { handleDefaultButton } from './interactionReplies/buttons/handleDefaultButton';
import { handleMenuButton } from './interactionReplies/buttons/handleMenuButton';
import { handleSpecialButton } from './interactionReplies/buttons/handleSpecialButton';
import { handleAchievementsCommand } from './interactionReplies/commands/achievements';
import { handleAffinityCommand } from './interactionReplies/commands/affinity';
import {
  generateMonsterInfosByConstructorName,
  getMonsterCatalog,
  handleInfosMonsterCommand,
} from './interactionReplies/commands/infos-monster';
import {
  generatePlayerInfos,
  handleInfosPlayerCommand,
} from './interactionReplies/commands/infos-player';
import { handleLeaderboardCommand } from './interactionReplies/commands/leaderboard';
import { handleMenuCommand } from './interactionReplies/commands/menu';
import { handleProfileCommand } from './interactionReplies/commands/profile';
import { handleQuestCommand } from './interactionReplies/commands/quest';
import { handleStartCommand } from './interactionReplies/commands/start';
import { handleTrainCommand } from './interactionReplies/commands/train';
import { Interaction } from './objects/enums/Interaction';
import { Lang } from './objects/enums/Lang';
import { MonsterDifficulty } from './objects/enums/MonsterDifficulty';
import { QuestAction } from './objects/enums/QuestAction';
import { QuestKey } from './objects/enums/QuestKey';
import { InteractionDataOption } from './objects/types/InteractionDataOption';
import { calculateGame } from './routes/game';
import { calculateRPG } from './routes/rpg';
import {
  ensurePlayerProfile,
  recordRunResult,
} from './services/progressionService';
import { buildComponents } from './utils/componentsBuilder';
import { verifySignature } from './utils/discordUtils';
import { decompressMoves } from './utils/movesUtils';
import { isTraining } from './utils/payloadUtils';
import { inferMonsterFromPayload } from './utils/runMonsterUtils';

config();

const app = new Hono();

const PLAYER_ID_BY_NAME: Record<string, number> = {
  kazuma: 0,
  darkness: 1,
  megumin: 2,
  aqua: 3,
};

const PLAYER_AUTOCOMPLETE_CHOICES = [
  { name: 'Kazuma', value: 0 },
  { name: 'Darkness', value: 1 },
  { name: 'Megumin', value: 2 },
  { name: 'Aqua', value: 3 },
];

const DIFFICULTY_AUTOCOMPLETE_CHOICES = [
  { name: 'Easy', value: MonsterDifficulty.Easy },
  { name: 'Medium', value: MonsterDifficulty.Medium },
  { name: 'Hard', value: MonsterDifficulty.Hard },
  { name: 'Very Hard', value: MonsterDifficulty.VeryHard },
  { name: 'Extreme', value: MonsterDifficulty.Extreme },
  { name: 'Legendary', value: MonsterDifficulty.Legendary },
];

function getApiLang(c: Context) {
  return c.req.query('lang') === 'fr';
}
app.get('/assets/*', (c: Context) => {
  const basePath = 'https://fox3000foxy.com/konosuba-rpg/';
  return c.redirect(`${basePath}${c.req.path}`);
});

app.get('/player/:playerName', (c: Context) => {
  const fr = getApiLang(c);
  const playerName = (c.req.param('playerName') || '').trim().toLowerCase();
  const characterId = PLAYER_ID_BY_NAME[playerName];

  if (characterId === undefined) {
    return c.json(
      {
        error: fr
          ? 'Personnage invalide. Utilisez Kazuma, Darkness, Megumin ou Aqua.'
          : 'Invalid player. Use Kazuma, Darkness, Megumin, or Aqua.',
      },
      400
    );
  }

  return c.json(generatePlayerInfos(fr, characterId).player);
});

app.get('/monster/:monsterConstructorName', (c: Context) => {
  const fr = getApiLang(c);

  const monsterConstructorName = c.req.param('monsterConstructorName') || '';
  const infos = generateMonsterInfosByConstructorName(
    monsterConstructorName,
    fr
  );
  if (!infos.creature) {
    return c.json(
      {
        error: fr ? 'Monstre non trouvé.' : 'Monster not found.',
        description: infos.command.data.embeds[0].description,
      },
      404
    );
  }

  return c.json(infos.creature);
});

app.get('/game/:lang/*', calculateGame);
app.get('/konosuba-rpg/:lang/*', calculateRPG);
app.post('/api/interactions', async (c: Context) => {
  const body = await c.req.text();
  const isVerified = await verifySignature(c, body);
  if (!isVerified) {
    return c.text('Invalid signature', 401);
  }

  const interaction: Interaction = JSON.parse(body);
  const langString = interaction?.guild?.features?.includes('COMMUNITY')
    ? interaction?.guild_locale
    : interaction?.locale;
  const lang = Object.values(Lang).includes(langString)
    ? (langString as Lang)
    : Lang.English;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === Lang.French;

  // ── Ping ──────────────────────────────────────────────────────────────────
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // ── Autocompletion slash ──────────────────────────────────────────────────
  if (interaction.type === 4) {
    if (interaction.data?.name === 'quest') {
      const options = interaction.data.options || [];
      const focused = options.find(option => option.focused);
      const focusedValue = String(focused?.value || '').toLowerCase();

      if (focused?.name === 'action') {
        const actions = [QuestAction.View, QuestAction.Claim]
          .filter(action => action.includes(focusedValue))
          .slice(0, 25)
          .map(action => ({ name: action, value: action }));

        return c.json({ type: 8, data: { choices: actions } });
      }

      if (focused?.name === 'quest_id') {
        const questKeys = Object.values(QuestKey)
          .filter(key => key.includes(focusedValue))
          .slice(0, 25)
          .map(key => ({ name: key, value: key }));

        return c.json({ type: 8, data: { choices: questKeys } });
      }
    }

    if (interaction.data?.name === 'infos-player') {
      const options = interaction.data.options || [];
      const focused = options.find(option => option.focused);
      const focusedValue = String(focused?.value || '').toLowerCase();

      if (focused?.name === 'character') {
        const choices = PLAYER_AUTOCOMPLETE_CHOICES
          .filter(choice => {
            const byName = choice.name.toLowerCase().includes(focusedValue);
            const byId = String(choice.value).includes(focusedValue);
            return byName || byId;
          })
          .slice(0, 25);

        return c.json({ type: 8, data: { choices } });
      }
    }

    if (interaction.data?.name === 'infos-monster') {
      const options = interaction.data.options || [];
      const focused = options.find(option => option.focused);
      const focusedValue = String(focused?.value || '').toLowerCase();

      if (focused?.name === 'monster') {
        const choices = getMonsterCatalog(fr)
          .filter(monster => monster.name.toLowerCase().includes(focusedValue))
          .slice(0, 25)
          .map(monster => ({ name: monster.name, value: monster.id }));

        return c.json({ type: 8, data: { choices } });
      }
    }

    if (interaction.data?.name === 'start') {
      const options = interaction.data.options || [];
      const focused = options.find(option => option.focused);
      const focusedValue = String(focused?.value || '').toLowerCase();

      if (focused?.name === 'difficulty') {
        const choices = DIFFICULTY_AUTOCOMPLETE_CHOICES
          .filter(choice => {
            const byName = choice.name.toLowerCase().includes(focusedValue);
            const byValue = choice.value.toLowerCase().includes(focusedValue);
            return byName || byValue;
          })
          .slice(0, 25);

        return c.json({ type: 8, data: { choices } });
      }
    }

    return c.json({ type: 8, data: { choices: [] } });
  }

  // ── Commandes slash ────────────────────────────────────────────────────────
  if (interaction.type === 2) {
    void ensurePlayerProfile(userID);

    // /start
    if (interaction.data?.name === 'start') {
      const options = interaction.data.options || [];
      const difficultyOption = options.find(opt => opt.name === 'difficulty');
      const difficulty = difficultyOption ? String(difficultyOption.value) : undefined;
      return handleStartCommand(c, userID, lang, fr, difficulty);
    }

    // /menu
    if (interaction.data?.name === 'menu') {
      return handleMenuCommand(c, userID, fr);
    }

    // /profile
    if (interaction.data?.name === 'profile') {
      return handleProfileCommand(c, userID, fr, interaction.data.options);
    }

    // /leaderboard
    if (interaction.data?.name === 'leaderboard') {
      return handleLeaderboardCommand(c, fr);
    }

    // /quest
    if (interaction.data?.name === 'quest') {
      return handleQuestCommand(c, userID, fr, interaction.data.options);
    }

    // /achievements
    if (interaction.data?.name === 'achievements') {
      return handleAchievementsCommand(c, userID, fr);
    }

    // /affinity
    if (interaction.data?.name === 'affinity') {
      return handleAffinityCommand(c, userID, fr, interaction.data.options);
    }

    // /train
    if (interaction.data?.name === 'train') {
      if (!interaction.data.options || interaction.data.options.length === 0) {
        return c.json({
          type: 4,
          data: {
            content: fr
              ? 'Veuillez spécifier un monstre. Exemple: /train goblin'
              : 'Please specify a monster. Example: /train goblin',
          },
        });
      }
      return handleTrainCommand(c, userID, lang, fr, interaction.data.options);
    }

    // /infos-player
    if (interaction.data?.name === 'infos-player') {
      const characterId = Number(
        interaction.data.options?.find(
          (o: InteractionDataOption) => o.name === 'character'
        )?.value
      );
      return handleInfosPlayerCommand(c, fr, characterId);
    }

    // /infos-monster
    if (interaction.data?.name === 'infos-monster') {
      if (!interaction.data.options || interaction.data.options.length === 0) {
        return c.json({
          type: 4,
          data: {
            content: fr
              ? 'Veuillez spécifier un monstre. Exemple: /infos-monster goblin'
              : 'Please specify a monster. Example: /infos-monster goblin',
          },
        });
      }

      return handleInfosMonsterCommand(c, fr, interaction.data.options);
    }

    return c.json({ error: 'Unknown command' }, 400);
  }

  // ── Boutons (composants) ───────────────────────────────────────────────────
  if (interaction.type === 3 && interaction.data?.custom_id) {
    const customId: string = interaction.data.custom_id;
    const colonIdx = customId.lastIndexOf(':');
    const encodedPayload =
      colonIdx !== -1 ? customId.slice(0, colonIdx) : customId;
    const payload = decompressMoves(encodedPayload);
    const owner = colonIdx !== -1 ? customId.slice(colonIdx + 1) : '';

    // Vérification du propriétaire (comme dans le JS d'origine)
    if (owner && owner !== userID && owner !== 'all') {
      return c.json({
        type: 4,
        data: {
          content: fr ? "Ce n'est pas votre partie !" : 'Not your game!',
          flags: 1 << 6,
        },
      });
    }

    console.log('Received button interaction with payload:', encodedPayload);

    if (encodedPayload.startsWith('menu.')) {
      try {
        return await handleMenuButton(c, encodedPayload, userID, lang, fr);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[menu] Interaction error:', message);
        return c.json({
          type: 4,
          data: {
            content: fr
              ? 'Erreur du menu. Reessayez dans quelques secondes.'
              : 'Menu error. Please try again in a few seconds.',
            flags: 1 << 6,
          },
        });
      }
    }

    const training = isTraining(payload);
    const inferredMonsterName = inferMonsterFromPayload(payload);
    const monsterName = inferredMonsterName || '';
    const { buttons, embedDescription, activePlayerName, gameState } =
      await buildComponents(payload, userID, lang);

    void recordRunResult({
      userId: userID,
      payload,
      state: gameState,
      training,
      monsterName: inferredMonsterName,
    });

    const special = interaction.data.custom_id.split(':')[0].endsWith('p');
    if (special) {
      return handleSpecialButton(
        interaction,
        c,
        payload,
        userID,
        lang,
        fr,
        monsterName,
        activePlayerName,
        embedDescription,
        buttons
      );
    } else {
      return handleDefaultButton(
        c,
        payload,
        userID,
        lang,
        fr,
        monsterName,
        embedDescription,
        buttons
      );
    }
  }
  return c.json({ error: 'Unknown interaction' }, 400);
});

function logEnvironmentStatus(): void {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const discordToken = process.env.DISCORD_TOKEN;
  const discordAppId = process.env.DISCORD_APPLICATION_ID;

  console.log('[startup] Environment variables status:');
  console.log(
    `  SUPABASE_URL: ${supabaseUrl ? '✅ set' : '❌ MISSING'}`
  );
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ set' : '❌ MISSING'}`
  );
  console.log(
    `  DISCORD_TOKEN: ${discordToken ? '✅ set' : '❌ MISSING'}`
  );
  console.log(
    `  DISCORD_APPLICATION_ID: ${discordAppId ? '✅ set' : '❌ MISSING'}`
  );

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[startup] ⚠️  Database progression (quests, profile, leaderboard) will NOT work without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  if (!discordToken || !discordAppId) {
    console.error('[startup] ❌ Discord bot requires DISCORD_TOKEN and DISCORD_APPLICATION_ID');
  }
}

export default app;

async function start() {
  logEnvironmentStatus();
  // if (navigator.userAgent !== 'Cloudflare-Workers') {
  const serve = (await import('@hono/node-server')).serve;
  serve({ fetch: app.fetch, port: 8787 });
  console.log('Server running on http://localhost:8787');
  // }
}
start();

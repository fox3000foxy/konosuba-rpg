import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { Lang } from '../../objects/enums/Lang';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { ensurePlayerProfile } from '../../services/progressionService';
import { handleAchievementsCommand } from './achievements.js';
import { handleAffinityCommand } from './affinity.js';
import { handleCharacterCommand } from './character.js';
import { handleCraftCommand } from './craft.js';
import { handleInfosMonsterCommand } from './infos-monster.js';
import { handleInfosPlayerCommand } from './infos-player.js';
import { handleInventoryCommand } from './inventory.js';
import { handleLeaderboardCommand } from './leaderboard.js';
import { handleMenuCommand } from './menu.js';
import { handleProfileCommand } from './profile.js';
import { handleQuestCommand } from './quest.js';
import { handleShopCommand } from './shop.js';
import { handleStartCommand } from './start.js';
import { handleTrainCommand } from './train.js';

export async function handleSlashCommand(c: Context, interaction: Interaction, userID: string, lang: Lang, fr: boolean) {
  void ensurePlayerProfile(userID);

  if (interaction.data?.name === 'start') {
    const options = interaction.data.options || [];
    const difficultyOption = options.find(opt => opt.name === 'difficulty');
    const difficulty = difficultyOption ? String(difficultyOption.value) : undefined;
    return handleStartCommand(c, userID, lang, fr, difficulty);
  }

  if (interaction.data?.name === 'menu') {
    return handleMenuCommand(c, userID, fr);
  }

  if (interaction.data?.name === 'profile') {
    return handleProfileCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'character') {
    return handleCharacterCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'leaderboard') {
    return handleLeaderboardCommand(c, fr);
  }

  if (interaction.data?.name === 'quest') {
    return handleQuestCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'achievements') {
    return handleAchievementsCommand(c, userID, fr);
  }

  if (interaction.data?.name === 'affinity') {
    return handleAffinityCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'inventory') {
    return handleInventoryCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'craft') {
    return handleCraftCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'train') {
    if (!interaction.data.options || interaction.data.options.length === 0) {
      return c.json({
        type: 4,
        data: {
          content: fr ? 'Veuillez spécifier un monstre. Exemple: /train goblin' : 'Please specify a monster. Example: /train goblin',
        },
      });
    }
    return handleTrainCommand(c, userID, lang, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'infos-player') {
    const characterId = Number(interaction.data.options?.find((o: InteractionDataOption) => o.name === 'character')?.value);
    return handleInfosPlayerCommand(c, fr, characterId);
  }

  if (interaction.data?.name === 'infos-monster') {
    if (!interaction.data.options || interaction.data.options.length === 0) {
      return c.json({
        type: 4,
        data: {
          content: fr ? 'Veuillez spécifier un monstre. Exemple: /infos-monster goblin' : 'Please specify a monster. Example: /infos-monster goblin',
        },
      });
    }

    return handleInfosMonsterCommand(c, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'shop') {
    return handleShopCommand(c, userID, fr, interaction.data.options);
  }

  return c.json({ error: 'Unknown command' }, 400);
}

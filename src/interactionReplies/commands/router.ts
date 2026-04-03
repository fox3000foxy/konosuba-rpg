import { Context } from 'hono';
import { Interaction } from '../../objects/enums/Interaction';
import { Lang } from '../../objects/enums/Lang';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { ensurePlayerProfile } from '../../services/progressionService';

export async function handleSlashCommand(c: Context, interaction: Interaction, userID: string, lang: Lang, fr: boolean) {
  void ensurePlayerProfile(userID);

  if (interaction.data?.name === 'start') {
    const { handleStartCommand } = await import('./start.js');
    const options = interaction.data.options || [];
    const difficultyOption = options.find(opt => opt.name === 'difficulty');
    const difficulty = difficultyOption ? String(difficultyOption.value) : undefined;
    return handleStartCommand(c, userID, lang, fr, difficulty);
  }

  if (interaction.data?.name === 'menu') {
    const { handleMenuCommand } = await import('./menu.js');
    return handleMenuCommand(c, userID, fr);
  }

  if (interaction.data?.name === 'profile') {
    const { handleProfileCommand } = await import('./profile.js');
    return handleProfileCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'character') {
    const { handleCharacterCommand } = await import('./character.js');
    return handleCharacterCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'leaderboard') {
    const { handleLeaderboardCommand } = await import('./leaderboard.js');
    return handleLeaderboardCommand(c, fr);
  }

  if (interaction.data?.name === 'quest') {
    const { handleQuestCommand } = await import('./quest.js');
    return handleQuestCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'achievements') {
    const { handleAchievementsCommand } = await import('./achievements.js');
    return handleAchievementsCommand(c, userID, fr);
  }

  if (interaction.data?.name === 'affinity') {
    const { handleAffinityCommand } = await import('./affinity.js');
    return handleAffinityCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'inventory') {
    const { handleInventoryCommand } = await import('./inventory.js');
    return handleInventoryCommand(c, userID, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'craft') {
    const { handleCraftCommand } = await import('./craft.js');
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
    const { handleTrainCommand } = await import('./train.js');
    return handleTrainCommand(c, userID, lang, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'infos-player') {
    const { handleInfosPlayerCommand } = await import('./infos-player.js');
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

    const { handleInfosMonsterCommand } = await import('./infos-monster.js');
    return handleInfosMonsterCommand(c, fr, interaction.data.options);
  }

  if (interaction.data?.name === 'shop') {
    const { handleShopCommand } = await import('./shop.js');
    return handleShopCommand(c, userID, fr, interaction.data.options);
  }

  return c.json({ error: 'Unknown command' }, 400);
}

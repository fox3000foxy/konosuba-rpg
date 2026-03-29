import { Context } from 'hono';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
  ensurePlayerProfile,
  getAchievementsOverview,
  getPlayerProfile,
  getPlayerRunSummary,
} from '../../services/progressionService';

export async function handleProfileCommand(
  c: Context,
  userID: string,
  fr: boolean,
  options?: InteractionDataOption[]
) {
  const mentioned = options?.find(option => option.name === 'mention')?.value;
  const targetUserId = mentioned ? String(mentioned) : userID;

  if (targetUserId === userID) {
    await ensurePlayerProfile(userID);
  }

  const profile = await getPlayerProfile(targetUserId);

  if (!profile) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? `Profil de <@${targetUserId}> introuvable pour le moment.`
          : `<@${targetUserId}> profile is unavailable right now.`,
        flags: 1 << 6,
      },
    });
  }

  const [achievements, runSummary] = await Promise.all([
    getAchievementsOverview(targetUserId, fr),
    getPlayerRunSummary(targetUserId),
  ]);

  const unlockedCount = achievements
    ? achievements.filter(item => item.unlocked).length
    : 0;
  const totalAchievements = achievements?.length || 0;
  const totalRuns = runSummary?.totalRuns ?? 0;
  const killedMonsters = runSummary?.killedMonsters ?? [];

  const nextLevelXp = profile.level * 100;
  const monstersText = killedMonsters.length
    ? killedMonsters
      .map(monster => `- ${monster.name} x${monster.count}`)
      .join('\n')
    : fr
      ? '- Aucun monstre battu pour le moment'
      : '- No defeated monsters yet';

  const description = fr
    ? `# Profil de <@${targetUserId}>\n\n**Niveau**: ${profile.level}\n**XP**: ${profile.xp}/${nextLevelXp}\n**Or**: ${profile.gold}\n**Achievements**: ${unlockedCount}/${totalAchievements}\n**Parties jouees**: ${totalRuns}\n\n**Monstres battus**\n${monstersText}`
    : `# <@${targetUserId}> profile\n\n**Level**: ${profile.level}\n**XP**: ${profile.xp}/${nextLevelXp}\n**Gold**: ${profile.gold}\n**Achievements**: ${unlockedCount}/${totalAchievements}\n**Games played**: ${totalRuns}\n\n**Defeated monsters**\n${monstersText}`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          color: 0x2b2d31,
        },
      ],
    },
  });
}

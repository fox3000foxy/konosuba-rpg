import { Context } from 'hono';
import { CharacterKey } from '../../objects/enums/CharacterKey';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
    ensurePlayerProfile,
    getCharacterProgresses,
    getCharacterStatsSnapshot
} from '../../services/progressionService';

function resolveCharacterKey(options: InteractionDataOption[] | undefined): CharacterKey | null {
  const value = options?.find(option => option.name === 'character')?.value;
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const key = value.trim().toLowerCase();
  if (key === CharacterKey.Darkness || key === CharacterKey.Aqua || key === CharacterKey.Megumin) {
    return key as CharacterKey;
  }

  return null;
}

export async function handleCharacterCommand(
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

  const charKey = resolveCharacterKey(options);
  const progresses = await getCharacterProgresses(targetUserId);
  const statsSnapshot = await getCharacterStatsSnapshot(targetUserId);

  if (!progresses || !statsSnapshot) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? `Profil de <@${targetUserId}> indisponible.`
          : `<@${targetUserId}> profile unavailable.`,
        flags: 1 << 6,
      },
    });
  }

  const progressMap = new Map(progresses.map(p => [p.characterKey, p]));
  const snapshotMap = new Map(statsSnapshot.map(s => [s.characterKey, s]));

  const toDisplay = charKey ? [charKey] : [CharacterKey.Darkness, CharacterKey.Megumin, CharacterKey.Aqua];

  const lines = toDisplay.map((key) => {
    const progress = progressMap.get(key);
    const snapshot = snapshotMap.get(key);

    if (!progress || !snapshot) {
      return fr
        ? `*${key}*: données non disponibles.`
        : `*${key}*: data unavailable.`;
    }

    return fr
      ? `**${key}**\n- Niveau: ${progress.level}\n- XP: ${progress.xp}\n- Affinite: ${progress.affinity}\n- Facteur: x${snapshot.factor.toFixed(2)}`
      : `**${key}**\n- Level: ${progress.level}\n- XP: ${progress.xp}\n- Affinity: ${progress.affinity}\n- Factor: x${snapshot.factor.toFixed(2)}`;
  });

  const title = fr
    ? `# Caractère de <@${targetUserId}>\n\n`
    : `# Character for <@${targetUserId}>\n\n`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: title + lines.join('\n\n'),
          color: 0x2b2d31,
        },
      ],
    },
  });
}

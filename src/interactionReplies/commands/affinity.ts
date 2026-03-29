import { Context } from 'hono';
import { CharacterKey } from '../../objects/enums/CharacterKey';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
    ensurePlayerProfile,
    getCharacterProgresses,
} from '../../services/progressionService';

const AFFINITY_DISPLAY_CAP = 100;
const AFFINITY_BAR_SIZE = 12;

function buildAffinityBar(value: number): string {
  const safeValue = Math.max(0, value);
  const ratio = Math.min(1, safeValue / AFFINITY_DISPLAY_CAP);
  const filled = Math.round(ratio * AFFINITY_BAR_SIZE);
  const empty = AFFINITY_BAR_SIZE - filled;
  return `[${'='.repeat(filled)}${'.'.repeat(empty)}]`;
}

export async function handleAffinityCommand(
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

  const characterProgresses = await getCharacterProgresses(targetUserId);

  if (!characterProgresses) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? `Affinite de <@${targetUserId}> indisponible pour le moment.`
          : `<@${targetUserId}> affinity is unavailable right now.`,
        flags: 1 << 6,
      },
    });
  }

  const characterByKey = new Map(
    characterProgresses.map(progress => [progress.characterKey, progress])
  );

  const darkness = characterByKey.get(CharacterKey.Darkness);
  const megumin = characterByKey.get(CharacterKey.Megumin);
  const aqua = characterByKey.get(CharacterKey.Aqua);

  const darknessAffinity = darkness?.affinity ?? 0;
  const meguminAffinity = megumin?.affinity ?? 0;
  const aquaAffinity = aqua?.affinity ?? 0;
  const totalAffinity = darknessAffinity + meguminAffinity + aquaAffinity;

  const darknessLine = `Darkness ${buildAffinityBar(darknessAffinity)} ${darknessAffinity}/${AFFINITY_DISPLAY_CAP}`;
  const meguminLine = `Megumin ${buildAffinityBar(meguminAffinity)} ${meguminAffinity}/${AFFINITY_DISPLAY_CAP}`;
  const aquaLine = `Aqua ${buildAffinityBar(aquaAffinity)} ${aquaAffinity}/${AFFINITY_DISPLAY_CAP}`;

  const description = fr
    ? `# Affinite de <@${targetUserId}>\n\n${darknessLine}\n${meguminLine}\n${aquaLine}\n\nTotal: **${totalAffinity}**`
    : `# <@${targetUserId}> affinity\n\n${darknessLine}\n${meguminLine}\n${aquaLine}\n\nTotal: **${totalAffinity}**`;

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

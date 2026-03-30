/** Function to build Discord components */

import { ButtonsLabels } from '../objects/enums/ButtonsLabels';
import { GameState } from '../objects/enums/GameState';
import { Lang } from '../objects/enums/Lang';
import { RawButton } from '../objects/enums/RawButton';
import { encodeGameplayButtons } from '../services/gameSessionService';
import { getCharacterStatsSnapshot } from '../services/progressionService';
import { makeid, restartId } from './idUtils';
import { buildImageUrl } from './imageUtils';
import { compressMoves } from './movesUtils';
import {
    addDifficultyToPayload,
    extractDifficulty,
    extractMonster,
    isTraining,
    removeDifficultyFromPayload,
} from './payloadUtils';
import processGame from './processGame';
import processUrl from './processUrl';

const ATTACK_LABELS = ['1', '4', '10'];
const HUG_LABELS = ['1', '4', '10'];

const ATTACK_LABELS_FR = ATTACK_LABELS.map(value =>
  ButtonsLabels.AttackFr.replace('x', value)
);
const ATTACK_LABELS_EN = ATTACK_LABELS.map(value =>
  ButtonsLabels.Attack.replace('x', value)
);
const HUG_LABELS_FR = HUG_LABELS.map(value =>
  ButtonsLabels.HugFr.replace('x', value)
);
const HUG_LABELS_EN = HUG_LABELS.map(value =>
  ButtonsLabels.Hug.replace('x', value)
);

export async function buildComponents(
  payload: string,
  userID: string,
  lang: Lang,
  disableChangeMonster = false,
  difficulty?: string
): Promise<{
  buttons: RawButton[];
  embedDescription: string[];
  activePlayerName: string | null;
  gameState: GameState;
}> {
  // Extraire la difficulté du payload si elle y est encodée
  const payloadDifficulty = extractDifficulty(payload);
  const cleanPayload = removeDifficultyFromPayload(payload);
  const effectiveDifficulty = difficulty || payloadDifficulty;

  const imageUrl = buildImageUrl(cleanPayload, lang, effectiveDifficulty);

  const [rand, moves, , monster, difficultyFromUrl] = processUrl(imageUrl);
  const characterStatsSnapshot = await getCharacterStatsSnapshot(userID);
  const characterFactors = characterStatsSnapshot
    ? characterStatsSnapshot.map(snapshot => snapshot.factor)
    : undefined;

  const { state, team, embedDescription } = await processGame(
    rand,
    moves,
    monster,
    lang,
    false,
    characterFactors,
    difficultyFromUrl || effectiveDifficulty
  );
  const training = isTraining(cleanPayload);
  const fr = lang === Lang.French;
  const langIndex = fr ? 1 : 0;

  const compressedPayload = compressMoves(cleanPayload);
  const compressedPayloadWithDifficulty = addDifficultyToPayload(
    compressedPayload,
    effectiveDifficulty
  );
  const restartPayload = restartId(cleanPayload);
  const restartPayloadWithDifficulty = addDifficultyToPayload(
    restartPayload,
    effectiveDifficulty
  );
  const userIdSuffix = `:${userID}`;
  const actionPrefix = `${compressedPayloadWithDifficulty}`;
  const activePlayerName = team.activePlayer?.name[langIndex] ?? null;
  const attackLabels = fr ? ATTACK_LABELS_FR : ATTACK_LABELS_EN;
  const hugLabels = fr ? HUG_LABELS_FR : HUG_LABELS_EN;

  const showAquaHealButton =
    activePlayerName === 'Megumin' && state === GameState.Incomplete;

  let buttons: RawButton[] = [];
  if (state === GameState.Incomplete) {
    disableChangeMonster = true;
    buttons = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: attackLabels[0],
            style: 4,
            custom_id: `${actionPrefix}a${userIdSuffix}`,
          },
          {
            type: 2,
            label: attackLabels[1],
            style: 4,
            custom_id: `${actionPrefix}a4${userIdSuffix}`,
          },
          {
            type: 2,
            label: attackLabels[2],
            style: 4,
            custom_id: `${actionPrefix}a10${userIdSuffix}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: hugLabels[0],
            style: 1,
            custom_id: `${actionPrefix}h${userIdSuffix}`,
          },
          {
            type: 2,
            label: hugLabels[1],
            style: 1,
            custom_id: `${actionPrefix}h4${userIdSuffix}`,
          },
          {
            type: 2,
            label: hugLabels[2],
            style: 1,
            custom_id: `${actionPrefix}h10${userIdSuffix}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: fr ? ButtonsLabels.DefendFr : ButtonsLabels.Defend,
            style: 3,
            custom_id: `${actionPrefix}d${userIdSuffix}`,
          },
          {
            type: 2,
            label: fr ? ButtonsLabels.HealFr : ButtonsLabels.Heal,
            style: 3,
            custom_id: `${actionPrefix}s${userIdSuffix}`,
            disabled: !showAquaHealButton,
          },
          {
            type: 2,
            label: fr
              ? ButtonsLabels.SpecialAttackFr
              : ButtonsLabels.SpecialAttack,
            style: 3,
            custom_id: `${actionPrefix}p${userIdSuffix}`,
            disabled: !team.activePlayer?.specialAttackReady,
          },
        ],
      },
    ];
  }

  buttons = [
    ...buttons,
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
          style: 2,
          custom_id: `${restartPayloadWithDifficulty}${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
          style: 2,
          custom_id: `${actionPrefix}g${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.ConsumablesFr : ButtonsLabels.Consumables,
          style: 1,
          custom_id: `consumables${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr
            ? ButtonsLabels.ChangeMonsterFr
            : ButtonsLabels.ChangeMonster,
          style: 2,
          custom_id: training
            ? addDifficultyToPayload(
                `train.${extractMonster(cleanPayload)}.${makeid(10)}`,
                effectiveDifficulty
              ) + userIdSuffix
            : addDifficultyToPayload(`${makeid(15)}`, effectiveDifficulty) +
              userIdSuffix,
          disabled: disableChangeMonster || training,
        },
      ],
    },
  ];

  const encodedButtons = await encodeGameplayButtons(buttons);

  return {
    buttons: encodedButtons,
    embedDescription,
    activePlayerName,
    gameState: state,
  };
}

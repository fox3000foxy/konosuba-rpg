/** Function to build Discord components */

import { ButtonsLabels } from "../enums/ButtonsLabels";
import { GameState } from "../enums/GameState";
import { Lang } from "../enums/Lang";
import { RawButton } from "../enums/RawButton";
import { makeid, restartId } from "./idUtils";
import { buildImageUrl } from "./imageUtils";
import { compressMoves } from "./movesUtils";
import { extractMonster, isTraining } from "./payloadUtils";
import processGame from "./processGame";
import processUrl from "./processUrl";

export async function buildComponents(
  payload: string,
  userID: string,
  lang: Lang,
  disableChangeMonster = false,
): Promise<{ buttons: RawButton[]; embedDescription: string[] }> {
  const imageUrl = buildImageUrl(payload, lang);

  const [rand, moves, , monster] = processUrl(imageUrl);
  const { state, team, embedDescription } = await processGame(
    rand,
    moves,
    monster,
    lang,
    false,
  );
  const training = isTraining(payload);
  const fr = lang === Lang.French;

  const compressedPayload = compressMoves(payload);
  const restartPayload = restartId(payload);
  const userIdSuffix = `:${userID}`;

  const showAquaHealButton =
    team.activePlayer?.name[lang === Lang.French ? 1 : 0] === "Megumin" &&
    state === GameState.Incomplete;

  if (state === GameState.Incomplete) {
    disableChangeMonster = true;
  }

  const buttons = [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? ButtonsLabels.AttackFr.replace("x", "1") : ButtonsLabels.Attack.replace("x", "1"),
          style: 4,
          custom_id: `${compressedPayload}a${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.AttackFr.replace("x", "4") : ButtonsLabels.Attack.replace("x", "4"),
          style: 4,
          custom_id: `${compressedPayload}a4${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.AttackFr.replace("x", "10") : ButtonsLabels.Attack.replace("x", "10"),
          style: 4,
          custom_id: `${compressedPayload}a10${userIdSuffix}`,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? ButtonsLabels.HugFr.replace("x", "1") : ButtonsLabels.Hug.replace("x", "1"),
          style: 1,
          custom_id: `${compressedPayload}h${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.HugFr.replace("x", "4") : ButtonsLabels.Hug.replace("x", "4"),
          style: 1,
          custom_id: `${compressedPayload}h4${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.HugFr.replace("x", "10") : ButtonsLabels.Hug.replace("x", "10"),
          style: 1,
          custom_id: `${compressedPayload}h10${userIdSuffix}`,
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
          custom_id: `${compressedPayload}d${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.HealFr : ButtonsLabels.Heal,
          style: 3,
          custom_id: `${compressedPayload}s${userIdSuffix}`,
          disabled: !showAquaHealButton,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.SpecialAttackFr : ButtonsLabels.SpecialAttack,
          style: 3,
          custom_id: `${compressedPayload}p${userIdSuffix}`,
          disabled: !team.activePlayer?.specialAttackReady,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
          style: 2,
          custom_id: `${restartPayload}${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
          style: 2,
          custom_id: `${compressedPayload}g${userIdSuffix}`,
        },
        {
          type: 2,
          label: fr ? ButtonsLabels.ChangeMonsterFr : ButtonsLabels.ChangeMonster,
          style: 2,
          custom_id: training
            ? `train.${extractMonster(payload)}.${makeid(10)}${userIdSuffix}`
            : `${makeid(15)}${userIdSuffix}`,
          disabled: disableChangeMonster || training,
        },
      ],
    },
  ];

  return { buttons, embedDescription };
}

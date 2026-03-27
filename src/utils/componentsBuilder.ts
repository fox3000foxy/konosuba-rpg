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

export async function buildComponents(payload: string, userID: string, lang: Lang, disableChangeMonster = false): Promise<{ buttons: RawButton[]; embedDescription: string[] }> {
  const imageUrl = buildImageUrl(payload, lang);

  const [rand, moves, , monster] = processUrl(imageUrl);
  const { state, team, embedDescription } = await processGame(rand, moves, monster, lang, false);
  const training = isTraining(payload);
  const fr = lang === Lang.French;

  let showAquaHealButton = false;

  if (team.activePlayer && team.activePlayer.name[lang === Lang.French ? 1 : 0] === "Megumin" && state === GameState.Incomplete) {
    showAquaHealButton = true;
  }

  if (state === GameState.Incomplete) {
    disableChangeMonster = true;
  }

  if (state === GameState.Good || state === GameState.Bad || state === GameState.Best || state === "giveup") {
    return {
      buttons: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
              style: 2,
              custom_id: `${restartId(payload)}:${userID}`,
            },
            {
              type: 2,
              label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
              style: 2,
              custom_id: `${compressMoves(payload)}g:${userID}`,
            },
            {
              type: 2,
              label: fr ? ButtonsLabels.ChangeMonsterFr : ButtonsLabels.ChangeMonster,
              style: 2,
              custom_id: training
                ? `train.${extractMonster(payload)}.${makeid(10)}:${userID}`
                : `${makeid(15)}:${userID}`
            },
          ],
        },
      ],
      embedDescription: embedDescription,
    };
  }

  return {
    buttons: [
      {
        type: 1,
        components: [
          { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "1") : ButtonsLabels.Attack.replace("x", "1"), style: 4, custom_id: `${compressMoves(payload)}a:${userID}` },
          { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "4") : ButtonsLabels.Attack.replace("x", "4"), style: 4, custom_id: `${compressMoves(payload)}a4:${userID}` },
          { type: 2, label: fr ? ButtonsLabels.AttackFr.replace("x", "10") : ButtonsLabels.Attack.replace("x", "10"), style: 4, custom_id: `${compressMoves(payload)}a10:${userID}` },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "1") : ButtonsLabels.Hug.replace("x", "1"), style: 1, custom_id: `${compressMoves(payload)}h:${userID}` },
          { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "4") : ButtonsLabels.Hug.replace("x", "4"), style: 1, custom_id: `${compressMoves(payload)}h4:${userID}` },
          { type: 2, label: fr ? ButtonsLabels.HugFr.replace("x", "10") : ButtonsLabels.Hug.replace("x", "10"), style: 1, custom_id: `${compressMoves(payload)}h10:${userID}` },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, label: fr ? ButtonsLabels.DefendFr : ButtonsLabels.Defend, style: 3, custom_id: `${compressMoves(payload)}d:${userID}` },
          { type: 2, label: fr ? ButtonsLabels.HealFr : ButtonsLabels.Heal, style: 3, custom_id: `${compressMoves(payload)}s:${userID}`, disabled: !showAquaHealButton },
          { type: 2, label: fr ? ButtonsLabels.SpecialAttackFr : ButtonsLabels.SpecialAttack, style: 3, custom_id: `${compressMoves(payload)}p:${userID}`, disabled: !(team.activePlayer?.specialAttackReady) },
        ],
      },

      {
        type: 1,
        components: [
          {
            type: 2,
            label: fr ? ButtonsLabels.RestartFr : ButtonsLabels.Restart,
            style: 2,
            custom_id: `${restartId(payload)}:${userID}`,
          },
          {
            type: 2,
            label: fr ? ButtonsLabels.GiveUpFr : ButtonsLabels.GiveUp,
            style: 2,
            custom_id: `${compressMoves(payload)}g:${userID}`,
          },
          {
            type: 2,
            label: fr ? ButtonsLabels.ChangeMonsterFr : ButtonsLabels.ChangeMonster,
            style: 2,
            custom_id: training
              ? `train.${extractMonster(payload)}.${makeid(10)}:${userID}`
              : `${makeid(15)}:${userID}`,
            disabled: disableChangeMonster || training,
          },
        ],

      },
    ],
    embedDescription: embedDescription,
  }
}
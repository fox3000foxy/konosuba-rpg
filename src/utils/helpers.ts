/** Utility functions */

import { verifyKey } from "discord-interactions";
import { Context } from "vm";
import { BASE_URL, DISCORD_API_URL } from "../config/constants";
import { ButtonsLabels } from "../enums/ButtonsLabels";
import { GameState } from "../enums/GameState";
import { Lang } from "../enums/Lang";
import processGame from "./processGame";
import processUrl from "./processUrl";

/** Compresses a string of moves */
export function compressMoves(moves: string): string {
  let result = '';
  let count = 1;

  for (let i = 1; i <= moves.length; i++) {
    if (moves[i] === moves[i - 1]) {
      count++;
    } else {
      result += moves[i - 1] + (count > 1 ? count : '');
      count = 1;
    }
  }

  return result;
}

/** Decompresses a compressed string of moves */
export function decompressMoves(comp: string): string {
  // eslint-disable-next-line security/detect-unsafe-regex
  return comp.replace(/([a-z])(\d+)?/g, (_, char, num) => {
    return char.repeat(num ? parseInt(num) : 1);
  });
}

/** Generates a random ID of a given length */
export function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/** Reconstruit l'URL de jeu à partir du customId brut (ex: "ABC123/a" → "/atk", etc.) */
export function customIdToPath(payload: string): string {
  return payload
    .split('a').join('/atk')
    .split('d').join('/def')
    .split('g').join('/giv')
    .split('h').join('/hug')
    .split('s').join('/hea')
    .split('p').join('/spe');
}

/** Génère l'ID "Recommencer" en effaçant les lettres d'action (comme dans le JS d'origine) */
export function restartId(payload: string): string {
  return payload
    .split('/').join('')
    .split('train').join('trqin')
    .split('a').join('')
    .split('trqin').join('train')
    .split('d').join('')
    .split('g').join('')
    .split('h').join('')
    .split('s').join('')
    .split('p').join('');
}

/** Détermine si le payload correspond à une session d'entraînement */
export function isTraining(payload: string): boolean {
  return payload.startsWith('train.');
}

/** Extrait le nom du monstre depuis un payload de training (ex: "train.Troll.ABC123") */
export function extractMonster(payload: string): string {
  return payload.split('.')[1] || 'Troll';
}

/** Construit l'URL d'image pour un payload donné */
export function buildImageUrl(payload: string, lang: string): string {
  const path = customIdToPath(payload);
  const training = isTraining(payload);
  const monsterName = training ? extractMonster(payload) : '';
  return `${BASE_URL}/konosuba-rpg/${lang}/${path}${training ? `/?training=true&monster=${encodeURIComponent(monsterName)}` : ''}`;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function followUpTimeout(interaction: any, reponse: { type: number, data?: any }, delay: number = 3000) {
  setTimeout(() => {
    if (reponse.type === 4) {
      reponse.data = {
        content: reponse.data.content || ' ',
        embeds: reponse.data.embeds || [],
        components: reponse.data.components || [],
      };
    }

    // PATCH /webhooks/<application_id>/<interaction_token>/messages/@original
    fetch(`${DISCORD_API_URL}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reponse.data),
    })
  }, delay);
}

/** Génère les deux rangées de boutons (identique JS d'origine) */
export async function buildComponents(payload: string, userID: string, lang: Lang, disableChangeMonster = false) {
  const imageUrl = buildImageUrl(payload, lang);

  const [rand, moves, , monster] = processUrl(imageUrl);
  const { state, team, embedDescription } = await processGame(rand, moves, monster, lang, false);
  const training = isTraining(payload);
  const fr = lang === Lang.French;

  let showAquaHealButton = false;

  if (team.activePlayer && team.activePlayer.name === "Megumin" && state === GameState.Incomplete) {
    showAquaHealButton = true;
  }

  if (state === GameState.Incomplete) {
    disableChangeMonster = true;
  }

  if (state === GameState.Good || state === GameState.Bad || state === GameState.Best || state === "giveup") { // GameState.Giveup n'est pas reconnu
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
              // En training : le bouton est désactivé (comme dans le JS). En partie normale : nouveau seed.
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
            // En training : le bouton est désactivé (comme dans le JS). En partie normale : nouveau seed.
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

export async function verifySignature(c: Context, body: string) {
  const signature = c.req.header('x-signature-ed25519');
  const timestamp = c.req.header('x-signature-timestamp');

  if (!c.env) return c.text('Environment variables not found', 500);
  const PUBLIC_KEY = (c.env.PUBLIC_KEY as string) || '8d61a524ccac360a3fd47de09c8df98487e7bec67884e4004feee5b1eb81062d';

  if (!signature || !timestamp || !PUBLIC_KEY) {
    if (!signature) console.warn('Missing signature');
    if (!timestamp) console.warn('Missing timestamp');
    if (!PUBLIC_KEY) console.warn('Missing public key');
    return c.text('invalid request headers', 400);
  }

  const isValid = await verifyKey(body, signature, timestamp, PUBLIC_KEY);
  // console.log(isValid ? 'Valid request signature' : 'Invalid request signature');
  if (!isValid) {
    console.warn('Invalid request signature');
    return c.text('invalid request signature', 401);
  }
}
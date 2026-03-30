// import fs from 'fs';
import { Creature, MessagesTemplates } from '../classes/Creature';
import { GenericCreature } from '../classes/GenericCreature';
import Troll from '../classes/mobs/Troll';
import { Aqua, Player, Team } from '../classes/Player';
import { Random } from '../classes/Random';
import lines from '../objects/data/constants';
import descriptions from '../objects/data/embedText';
import { generateMob } from '../objects/data/mobMap';
import { getMonstersByDifficulty } from '../objects/data/monsterDifficultyMap';
import { EndMessages } from '../objects/enums/EndMessages';
import { GameState } from '../objects/enums/GameState';
import { Lang } from '../objects/enums/Lang';
import { MonsterDifficulty } from '../objects/enums/MonsterDifficulty';
import { PlayerAction } from '../objects/enums/player/PlayerAction';
import { Prefix } from '../objects/enums/Prefix';
import { Game } from '../objects/types/Game';
import { LinesType } from '../objects/types/LinesType';
import renderImage from './renderImage';

const linesTyped = lines as LinesType;
const descriptionsTyped = descriptions as LinesType;

export function pascalCaseToString(pascalCaseWord: string): string {
  const regex = /([a-z])([A-Z])/g;
  const stringWithSpaces = pascalCaseWord.replace(regex, '$1 $2');
  return stringWithSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCreatureNameAndPrefix(
  creature: Creature | Troll,
  lang: Lang,
  gender: string
): { name: string; prefix: string } {
  const langIndex = lang === Lang.French ? 1 : 0;
  const name = creature.name[langIndex];
  const prefix = creature.prefix
    ? lang === Lang.French
      ? gender === 'female'
        ? Prefix.French_Undetermined_Feminine
        : Prefix.French_Undetermined_Masculine
      : Prefix.English_Determined
    : Prefix.None;
  return { name, prefix };
}

function generateMessage(
  template: MessagesTemplates,
  replacements: Record<string, string | number>
): string {
  return Object.keys(replacements).reduce(
    (msg, key) => msg.replace(String(key), String(replacements[key])),
    template
  );
}

function scaleStat(value: number, factor: number, minimum: number): number {
  return Math.max(minimum, Math.round(value * factor));
}

function applyTeamLevelFactors(team: Team, factors?: number[]): void {
  if (!factors || factors.length !== team.players.length) {
    return;
  }

  team.players.forEach((player, index) => {
    const factor = factors[index] ?? 1;
    const nextHpMax = scaleStat(player.hpMax, factor, 1);
    const nextAttackMin = Math.max(0, Math.round(player.attack[0] * factor));
    const nextAttackMax = Math.max(
      nextAttackMin,
      scaleStat(player.attack[1], factor, 1)
    );

    player.hpMax = nextHpMax;
    player.hp = nextHpMax;
    player.attack = [nextAttackMin, nextAttackMax];
  });
}

function handlePlayerAction({
  move,
  currentPlayer,
  creature,
  rand,
  lang,
  linesTyped,
  descriptionsTyped,
  messages,
  embedDescription,
}: {
  move: string;
  currentPlayer: Aqua | Player;
  creature: Creature | Troll;
  rand: Random;
  lang: Lang;
  linesTyped: LinesType;
  descriptionsTyped: LinesType;
  messages: string[];
  embedDescription: string[];
}): void {
  const langIndex = lang === Lang.French ? 1 : 0;
  switch (move) {
    case PlayerAction.Def.toLocaleUpperCase(): {
      const dmg = rand.randint(
        currentPlayer.attack[0],
        currentPlayer.attack[1]
      );
      const playerIndex = currentPlayer.playerId;
      const rng = rand.randint(
        0,
        linesTyped[lang].youDefendMsgs[playerIndex].length - 1
      );
      const msg = generateMessage(
        linesTyped[lang].youDefendMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
          DAMAGE: dmg,
        }
      );
      const desc = generateMessage(
        descriptionsTyped[lang].youDefendMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
          DAMAGE: dmg,
        }
      );
      messages.push(msg);
      embedDescription.push(desc);
      currentPlayer.performAction(PlayerAction.Def);
      break;
    }
    case PlayerAction.Atk.toLocaleUpperCase(): {
      const dmg = rand.randint(
        currentPlayer.attack[0],
        currentPlayer.attack[1]
      );
      creature.dealAttack(dmg);
      const playerIndex = currentPlayer.playerId;
      const rng = rand.randint(
        0,
        linesTyped[lang].youAttackMsgs[playerIndex].length - 1
      );
      const msg = generateMessage(
        linesTyped[lang].youAttackMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
          DAMAGE: dmg,
        }
      );
      const desc = generateMessage(
        descriptionsTyped[lang].youAttackMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
          DAMAGE: dmg,
        }
      );
      messages.push(msg);
      embedDescription.push(desc);
      currentPlayer.performAction(PlayerAction.Atk);
      break;
    }
    case PlayerAction.Hug.toLocaleUpperCase(): {
      const playerIndex = currentPlayer.playerId;
      const rng = rand.randint(
        0,
        linesTyped[lang].youHugMsgs[playerIndex].length - 1
      );
      const msg = generateMessage(
        linesTyped[lang].youHugMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
        }
      );
      const desc = generateMessage(
        descriptionsTyped[lang].youHugMsgs[playerIndex][rng],
        {
          CREATURE: creature.name[langIndex],
        }
      );
      messages.push(msg);
      embedDescription.push(desc);
      const loveDecrease = rand.randint(1, 4);
      creature.giveHug(loveDecrease);
      currentPlayer.performAction(PlayerAction.Hug);
      break;
    }
    case PlayerAction.Hea.toLocaleUpperCase(): {
      if (currentPlayer.name[langIndex] === 'Aqua') {
        currentPlayer.performAction(PlayerAction.Hea);
        (currentPlayer as Aqua).heal();
        const rng = rand.randint(0, linesTyped[lang].aquaHealMsgs.length - 1);
        const msg = linesTyped[lang].aquaHealMsgs[rng];
        const desc = descriptionsTyped[lang].aquaHealMsgs[rng];
        messages.push(msg);
        embedDescription.push(desc);
      }
      break;
    }
    case PlayerAction.Spe.toLocaleUpperCase(): {
      if (currentPlayer.specialAttackReady) {
        const dmg = rand.randint(
          currentPlayer.attack[0],
          currentPlayer.attack[1]
        );
        const specialDmgMultiplier = rand.randint(2, 4);
        const totalDmg = dmg * specialDmgMultiplier;
        creature.dealAttack(totalDmg);
        currentPlayer.performAction(PlayerAction.Spe);
        const playerIndex = currentPlayer.playerId;
        const rng = rand.randint(
          0,
          linesTyped[lang].youSpecialAttackMsgs[playerIndex].length - 1
        );
        const msg = generateMessage(
          linesTyped[lang].youSpecialAttackMsgs[playerIndex][rng],
          {
            CREATURE: creature.name[langIndex],
            DAMAGE: totalDmg,
          }
        );
        const desc = generateMessage(
          descriptionsTyped[lang].youSpecialAttackMsgs[playerIndex][rng],
          {
            CREATURE: creature.name[langIndex],
            DAMAGE: totalDmg,
          }
        );
        messages.push(msg);
        embedDescription.push(desc);
      }
      break;
    }
  }
}

export default async function processGame(
  rand: Random,
  moves: string[],
  monsterName: string | null = null,
  lang: Lang = Lang.English,
  renderingImage: boolean = true,
  teamLevelFactors?: number[],
  difficulty?: string | MonsterDifficulty | null
): Promise<Game> {
  lang = lang === Lang.French ? Lang.French : Lang.English;
  const team = new Team();
  applyTeamLevelFactors(team, teamLevelFactors);

  // Precompute monster and team setup
  const creature = monsterName
    ? generateMob().find(
        MobClass =>
          MobClass.name[lang === Lang.French ? 1 : 0].toLowerCase() ===
          monsterName.toLowerCase()
      ) || new Troll()
    : rand.choice(Object.values(getMonstersByDifficulty(difficulty || null)));

  if (creature instanceof GenericCreature) {
    creature.pickColor(rand);
  }

  const { name, prefix } = getCreatureNameAndPrefix(
    creature as Creature,
    lang,
    creature.gender
  );

  const messages: string[] = [
    lang === Lang.French
      ? `Attention, ${prefix}${name} !`
      : `Watch out, ${prefix}${name}!`,
  ];

  let embedDescription: string[] = [
    lang === Lang.French
      ? 'Utilisez les boutons pour attaquer, défendre ou faire un câlin à la créature. Essayez de réduire ses points de vie à zéro ou son amour à zéro pour gagner !'
      : 'Use the buttons to attack, defend, or hug the creature. Try to reduce its HP to zero or its love to zero to win!',
  ];

  let state: GameState = GameState.Incomplete;
  let playerId: number;
  let counter = -1;

  // Reset special attack status for all players
  team.players.forEach(player => player.resetSpecialAttack());

  // Precompute reusable values
  const langIndex = lang === Lang.French ? 1 : 0;
  let activePlayers: Player[];

  // Reducing the creature HP by dividing it per 2
  creature.hpMax = Math.ceil(creature.hpMax / 2);
  creature.hp = creature.hpMax;

  // console.log('Initial game state:', {
  //   creature: {
  //     name: creature.name,
  //     hp: creature.hp,
  //     love: creature.love,
  //   },
  //   team: team.players.map(player => ({
  //     name: player.name,
  //     hp: player.hp,
  //   })),
  // });

  for (const move of moves) {
    activePlayers = team.players.filter(player => player.hp > 0);
    if (state !== GameState.Incomplete) break; // Early exit if game state is resolved

    if (move === 'GIV') {
      state = GameState.Giveup;
      break;
    }

    embedDescription = [];
    messages.length = 0;

    counter += 1;
    playerId = counter % activePlayers.length;

    const currentPlayer = activePlayers[playerId];
    team.setActivePlayer(currentPlayer);

    handlePlayerAction({
      move,
      currentPlayer,
      creature: creature as Creature,
      rand,
      lang,
      linesTyped,
      descriptionsTyped,
      messages,
      embedDescription,
    });

    // Check if creature is defeated
    if (creature.hp <= 0) {
      state = GameState.Good;
      break;
    }

    if (creature.love <= 0) {
      state = GameState.Best;
      break;
    }

    // Skip creature's turn if current player is not Aqua
    if (currentPlayer !== activePlayers[activePlayers.length - 1]) {
      continue;
    }

    // Creature's turn
    const randomPlayer = rand.choice(activePlayers.filter(p => p.hp > 0));
    const creatureMove = creature.turn({
      lang,
      dmg: rand.randint(creature.attack[0], creature.attack[1]),
      player: randomPlayer,
    });

    if (randomPlayer.defending) {
      const { name, prefix } = getCreatureNameAndPrefix(
        creature as Creature,
        lang,
        creature.gender
      );
      const msg = generateMessage(
        MessagesTemplates[
          `${lang === Lang.French ? 'French' : 'English'}_CreatureMisses`
        ],
        {
          NAME: prefix + name,
          DMG: creatureMove[1],
          PLAYER: randomPlayer.name[langIndex],
        }
      );
      messages.push(msg);
      embedDescription.push(msg);
    } else {
      randomPlayer.hp -= creatureMove[1];
      const msg =
        randomPlayer.hp > 0
          ? creatureMove[0]
          : `${creatureMove[0]} ${randomPlayer.name[langIndex]} is down...`;
      messages.push(msg);
      embedDescription.push(msg);
    }

    activePlayers = team.players.filter(player => player.hp > 0);

    // Check if all players are down
    if (activePlayers.length === 0) {
      state = GameState.Bad;
      break;
    }
  }

  // Finalize game state
  if (state === GameState.Incomplete && moves.length > 0) {
    state = GameState.Incomplete;
  }

  if (state === GameState.Good || state === GameState.Best) {
    embedDescription.push(
      lang === Lang.French ? EndMessages.French_Good : EndMessages.English_Good
    );
  }

  if (renderingImage) {
    const image = await renderImage(
      state,
      messages,
      team,
      creature as Creature,
      lang
    );
    return {
      image,
      state,
      messages,
      embedDescription,
      team,
      creature: creature as Creature,
      training: !!monsterName,
    };
  }

  return {
    state,
    messages,
    embedDescription,
    team,
    creature: creature as Creature,
    training: !!monsterName,
  };
}

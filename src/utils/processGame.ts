// import fs from 'fs';
import { Creature, MessagesTemplates } from '../classes/Creature';
import { GenericCreature } from '../classes/GenericCreature';
import Troll from '../classes/mobs/Troll';
import { Team } from '../classes/Player';
import { Random } from '../classes/Random';
import lines from '../data/constants';
import { mobMap } from '../data/mobMap';
import { GameState } from '../enums/GameState';
import { Lang } from '../enums/Lang';
import { PlayerAction } from '../enums/player/PlayerAction';
import { Prefix } from '../enums/Prefix';
import { Game } from '../types/Game';
import { LinesType } from '../types/LinesType';
import renderImage from './renderImage';

const linesTyped = lines as LinesType;

export function pascalCaseToString(pascalCaseWord: string): string {
  const regex = /([a-z])([A-Z])/g;
  const stringWithSpaces = pascalCaseWord.replace(regex, '$1 $2');
  return stringWithSpaces.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default async function processGame(
  rand: Random,
  moves: string[],
  monsterName: string | null = null,
  lang: Lang = Lang.English,
  renderingImage: boolean = true
): Promise<Game> {
  lang = lang === Lang.French ? Lang.French : Lang.English;
  const team = new Team();
  let creature: Creature | null = null;

  if (monsterName) {
    const monsterInstance = mobMap.find((MobClass) => MobClass.name.toLowerCase() === monsterName.toLowerCase());
    if (monsterInstance) {
      creature = monsterInstance;
    }
  } else {
    const monsterInstance = rand.choice(Object.values(mobMap));
    creature = monsterInstance;
  }

  if (!creature) {
    const troll = new Troll();
    troll.pickColor(rand);
    creature = troll;
    // throw new Error("Failed to create creature");
  }

  if (creature instanceof GenericCreature) {
    creature.pickColor(rand);
  }

  creature.name = pascalCaseToString(monsterName || creature.constructor.name);

  const messages = [
    lang === Lang.French
      ? `Attention, ${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name} !`
      : `Watch out, ${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name} !`,
  ];

  let state: GameState = GameState.Incomplete;
  let playerId;
  let counter = -1;
  const playerCount = team.players.length;

  for (const move of moves) {
    messages.length = 0;
    if (counter >= 0) {
      team.players[counter % playerCount].performAction(PlayerAction.Idle);
    }
    counter += 1;
    playerId = counter % playerCount;

    // Skip players with 0 HP
    while (team.players[playerId].hp <= 0) {
      playerId = (playerId + 1) % playerCount;
    }

    const currentPlayer = team.players[playerId];
    currentPlayer.defending = move === PlayerAction.Def.toLocaleUpperCase();

    if (currentPlayer.defending) {
      const dmg = rand.randint(currentPlayer.attack[0], currentPlayer.attack[1]);
      const msg = rand.choice(linesTyped[lang as Lang].youDefendMsgs[playerId])
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());
      messages.push(msg);
      currentPlayer.performAction(PlayerAction.Def);
    } else if (move === PlayerAction.Atk.toLocaleUpperCase()) {
      const dmg = rand.randint(currentPlayer.attack[0], currentPlayer.attack[1]);
      creature.dealAttack(dmg);
      const msg = rand.choice(linesTyped[lang as Lang].youAttackMsgs[playerId])
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());
      messages.push(msg);
      currentPlayer.performAction(PlayerAction.Atk);
    } else if (move === PlayerAction.Hug.toLocaleUpperCase()) {
      const msg = rand.choice(linesTyped[lang as Lang].youHugMsgs[playerId])
        .replace("CREATURE", creature.name);
      messages.push(msg);
      const loveDecrease = rand.randint(1, 4);
      creature.giveHug(loveDecrease);
      currentPlayer.performAction(PlayerAction.Hug);
    }

    if (creature.hp <= 0) {
      state = GameState.Good;
      break;
    }

    if (creature.love <= 0) {
      state = GameState.Best;
      break;
    }

    const creatureMove = creature.turn({ lang, dmg: rand.randint(creature.attack[0], creature.attack[1]) });
    if (currentPlayer.defending) {
      messages.push(
        lang === Lang.French
          ? MessagesTemplates.French_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.French_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString())
          : MessagesTemplates.English_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.English_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString())
      );
    } else {
      currentPlayer.hp -= creatureMove[1];
      if (currentPlayer.hp > 0) {
        messages.push(creatureMove[0]);
      } else {
        messages.push(
          lang === Lang.French
            ? `${creatureMove[0]} ${currentPlayer.name} est à terre...`
            : `${creatureMove[0]} ${currentPlayer.name} is down...`
        );
      }
    }

    if (currentPlayer.hp <= 0) {
      state = GameState.Bad;
      break;
    }

    if (move === "GIV") {
      state = GameState.Giveup;
      break;
    }
  }

  const training = !!monsterName;
  if (state === null && moves.length > 0) state = GameState.Incomplete;
  if (renderingImage) {
    const image = await renderImage(state, messages, team, creature, lang);
    return { image, state, messages, team, creature, training };
  } else {
    return { state, messages, team, creature, training };
  }
}

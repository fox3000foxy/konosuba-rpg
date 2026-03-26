// import fs from 'fs';
import { Creature } from '../classes/Creature';
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

function pascalCaseToString(pascalCaseWord: string): string {
  const regex = /([a-z])([A-Z])/g;
  const stringWithSpaces = pascalCaseWord.replace(regex, '$1 $2');
  return stringWithSpaces.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default async function processGame(
  rand: Random,
  moves: string[],
  monster: string | null = null,
  lang: string = 'en',
  renderingImage: boolean = true
): Promise<Game> {
  lang = lang === 'fr' ? 'fr' : 'en';
  const team = new Team(rand);
  let creature: Creature | null;

  if (monster) {
    const MonsterClass = mobMap[monster] || Troll;
    creature = new MonsterClass(rand);
  } else {
    mobMap["troll"] = Troll;
    const CreatureClass = mobMap[rand.choice(Object.keys(mobMap))] || Troll;
    creature = new CreatureClass(rand);
  }

  creature.name = pascalCaseToString(monster || creature.constructor.name);

  const messages = [
    lang === 'fr'
      ? `Attention, ${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name} !`
      : `Watch out, ${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name} !`,
  ];

  let state: GameState = GameState.Incomplete;
  let playerId;
  let counter = -1;
  // console.log(moves)
  for (const move of moves) {
    // const move = moves[i]
    messages.length = 0;
    if (counter >= 0)
      team.players[counter % 4].performAction(PlayerAction.Idle);
    counter += 1;
    playerId = counter % 4;
    if (playerId == 0 && team.players[0].hp <= 0) playerId = 1;
    else if (playerId == 1 && team.players[1].hp <= 0) playerId = 2;
    else if (playerId == 2 && team.players[2].hp <= 0) playerId = 3;
    else if (playerId == 3 && team.players[3].hp <= 0) playerId = 0;

    team.players[playerId].defending = move === PlayerAction.Def.toLocaleUpperCase();

    if (team.players[playerId].defending) {
      const dmg = rand.randint(team.players[playerId].attack[0], team.players[playerId].attack[1]);
      const msg = rand.choice(linesTyped[lang as Lang].youDefendMsgs[playerId]).replace("CREATURE", creature.name).replace("DAMAGE", dmg.toString());
      messages.push(msg);
      team.players[playerId].performAction(PlayerAction.Def);
    }
    if (move === PlayerAction.Atk.toLocaleUpperCase()) {
      const dmg = rand.randint(team.players[playerId].attack[0], team.players[playerId].attack[1]);
      creature.dealAttack(dmg);
      const msg = rand.choice(linesTyped[lang as Lang].youAttackMsgs[playerId]).replace("CREATURE", creature.name).replace("DAMAGE", dmg.toString());
      messages.push(msg);
      team.players[playerId].performAction(PlayerAction.Atk);
    }
    if (move === PlayerAction.Hug.toLocaleUpperCase()) {
      const msg = rand.choice(linesTyped[lang as Lang].youHugMsgs[playerId]).replace("CREATURE", creature.name);
      messages.push(msg);
      creature.giveHug();
      team.players[playerId].performAction(PlayerAction.Hug);
    }

    if (creature.hp <= 0) {
      state = GameState.Good;
      break;
    }

    if (creature.love <= 0) {
      state = GameState.Best;
      break;
    }

    let creatureMove = creature.turn(lang);
    if (team.players[playerId].defending) {
      creatureMove = [creatureMove[0].replace(creatureMove[1].toString(), "0"), creatureMove[1]];
      messages.push(
        lang == Lang.French ?
          `${creature.prefix ? Prefix.French_Determined : Prefix.None}${creature.name} a essayé de l'attaquer mais l'a donc raté.` :
          `${creature.prefix ? Prefix.English_Determined : Prefix.None}${creature.name} tried to attack but missed.`
      );
    }


    if (!team.players[playerId].defending) {
      team.players[playerId].hp -= creatureMove[1];
      if (team.players[playerId].hp > 0)
        messages.push(creatureMove[0]);
      else
        messages.push(lang == Lang.French ?
          creatureMove[0] + " " + team.players[playerId].name + " est a terre..." :
          creatureMove[0] + " " + team.players[playerId].name + " is down..."
        );
    }

    if (team.players[playerId].hp <= 0) {
      state = GameState.Bad;
      break;
    }
    if (move === "GIV") { // Give Up is not an action performable by a character, it's a signal that the player wants to end the game immediately
      state = GameState.Giveup;
      break;
    }
  }

  const training = !!monster
  if (state === null && moves.length > 0) state = GameState.Incomplete;
  if (renderingImage) {
    const image = await renderImage(state, messages, team, creature, lang);
    return { image, state, messages, team, creature, training };
  } else {
    return { state, messages, team, creature, training };
  }
}

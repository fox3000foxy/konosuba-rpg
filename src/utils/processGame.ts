// import fs from 'fs';
import Player from '../classes/Player';
import { Creature } from '../classes/mobs/Creature';
import Troll from '../classes/mobs/Troll';
import { Random } from './Random';
import lines from './constants';
import { mobMap } from './mobMap';
import renderImage from './renderImage';

type Lang = 'en' | 'fr';

type LinesType = {
  [key in Lang]: {
    youAttackMsgs: string[][];
    youDefendMsgs: string[][];
    youHugMsgs: string[][];
  };
};

const linesTyped = lines as LinesType;

function pascalCaseToString(pascalCaseWord: string): string {
  const regex = /([a-z])([A-Z])/g;
  const stringWithSpaces = pascalCaseWord.replace(regex, '$1 $2');
  return stringWithSpaces.charAt(0).toUpperCase() + stringWithSpaces.slice(1);
}

export default async function processGame(
  rand: Random,
  moves: string[],
  monster: string | null = null,
  lang: string = 'en'
): Promise<any> {
  lang = lang === 'fr' ? 'fr' : 'en';
  const player = new Player(rand);
  let creature: Creature | null = null;

  if (monster) {
    const MonsterClass = mobMap[monster] || Troll;
    creature = new MonsterClass(rand);
  } else {
    // commeting because : TypeError: rand.choice(...) is not a constructor
    // creature = new (rand.choice(creatureClasses) as new (rand: Random) => Creature)(rand);

    // const creatureClass = rand.choice(creatureClasses) as Creature;
    // creature = new creatureClass(rand);
    mobMap["troll"] = Troll;
    const CreatureClass = mobMap[rand.choice(Object.keys(mobMap))] || Troll;
    creature = new CreatureClass(rand);
  }

  if (lang !== 'fr') {
    creature.name = pascalCaseToString(monster || creature.constructor.name);
  }

  const messages = [
    lang === 'fr'
      ? `Attention, ${creature.prefix ? 'un ' : ''}${creature.name} !`
      : `Watch out, ${creature.prefix ? 'a ' : ''}${creature.name} !`,
  ];

  let state = null;
  let playerId = 0;
  let counter = -1
  // console.log(moves)
  for (const move of moves) {
    // const move = moves[i]
    messages.length = 0;
    counter += 1;
    playerId = counter % 4;
    if (playerId == 0 && player.hp[0] <= 0) playerId = 1;
    else if (playerId == 1 && player.hp[1] <= 0) playerId = 2;
    else if (playerId == 2 && player.hp[2] <= 0) playerId = 3;
    else if (playerId == 3 && player.hp[3] <= 0) playerId = 0;
    // else {
    // state = "bad";
    // break;
    // }
    player.currentPlayerId = playerId;

    player.defending = move === "DEF";
    if (player.defending) {
      const dmg = rand.randint(player.attack[playerId][0], player.attack[playerId][1]);
      const msg = rand.choice(linesTyped[lang as Lang].youDefendMsgs[playerId]).replace("CREATURE", creature.name).replace("DAMAGE", dmg.toString());
      messages.push(msg);
      player.actionDef(msg, playerId);
    }
    if (move === "ATK") {
      const dmg = rand.randint(player.attack[playerId][0], player.attack[playerId][1]);
      creature.dealAttack(dmg);
      const msg = rand.choice(linesTyped[lang as Lang].youAttackMsgs[playerId]).replace("CREATURE", creature.name).replace("DAMAGE", dmg.toString());
      messages.push(msg);
      player.actionAtk(msg, playerId);
    }
    if (move === "HUG") {
      const msg = rand.choice(linesTyped[lang as Lang].youHugMsgs[playerId]).replace("CREATURE", creature.name);
      messages.push(msg);
      creature.giveHug();
      player.actionHug(msg, playerId);
    }

    if (creature.hp <= 0) {
      state = "good";
      break;
    }

    if (creature.love <= 0) {
      state = "best";
      break;
    }

    let creatureMove = creature.turn(lang);
    if (player.defending) {
      creatureMove = [creatureMove[0].replace(creatureMove[1].toString(), "0"), creatureMove[1]];
      messages.push(
        lang == "fr" ?
          `${creature.prefix ? "Le " : ""}${creature.name} a essayé de l'attaquer mais l'a donc raté.` :
          `${creature.prefix ? "The " : ""}${creature.name} tried to attack but missed.`
      );
    }


    if (!player.defending) {
      player.hp[player.currentPlayerId] -= creatureMove[1];
      if (player.hp[player.currentPlayerId])
        messages.push(creatureMove[0]);
      else
        messages.push(lang == "fr" ? creatureMove[0] + " " + player.name[player.currentPlayerId] + " est a terre..." : creatureMove[0] + " " + player.name[player.currentPlayerId] + " is down...");
    }

    if (player.hp[0] <= 0 && player.hp[1] <= 0 && player.hp[2] <= 0 && player.hp[3] <= 0) {
      state = "bad";
      break;
    }
    if (move === "GIV") {
      state = "giveup";
      break;
    }
  }

  let training = !!monster
  const image = await renderImage(state, messages, player, creature, rand, training, lang);
  return image;
}

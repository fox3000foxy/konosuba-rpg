// import fs from 'fs';
import { Creature, MessagesTemplates } from '../classes/Creature';
import { GenericCreature } from '../classes/GenericCreature';
import Troll from '../classes/mobs/Troll';
import { Aqua, Team } from '../classes/Player';
import { Random } from '../classes/Random';
import lines from '../data/constants';
import descriptions from '../data/embedText';
import { generateMob } from '../data/mobMap';
import { EndMessages } from '../enums/EndMessages';
import { GameState } from '../enums/GameState';
import { Lang } from '../enums/Lang';
import { PlayerAction } from '../enums/player/PlayerAction';
import { Prefix } from '../enums/Prefix';
import { Game } from '../types/Game';
import { LinesType } from '../types/LinesType';
import renderImage from './renderImage';

const linesTyped = lines as LinesType;
const descriptionsTyped = descriptions as LinesType;

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
    const monsterInstance = generateMob().find((MobClass) => MobClass.name.toLowerCase() === monsterName.toLowerCase());
    if (monsterInstance) {
      creature = monsterInstance;
    }
  } else {
    const monsterInstance = rand.choice(Object.values(generateMob()));
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
      ? `Attention, ${creature.prefix ? Prefix.French_Undetermined_Masculine : Prefix.None}${creature.name} !`
      : `Watch out, ${creature.prefix ? Prefix.English_Undetermined : Prefix.None}${creature.name} !`,
  ];

  let embedDescription = lang === Lang.French
    ? ["Utilisez les boutons pour attaquer, défendre ou faire un câlin à la créature. Essayez de réduire ses points de vie à zéro ou son amour à zéro pour gagner !"]
    : ["Use the buttons to attack, defend, or hug the creature. Try to reduce its HP to zero or its love to zero to win!"];

  let state: GameState = GameState.Incomplete;
  let playerId;
  let counter = -1;
  const playerCount = team.players.length;

  // reset special attack status for all players at the start of the game
  team.players.forEach(player => player.resetSpecialAttack());

  for (const move of moves) {
    embedDescription = [];
    messages.length = 0;

    counter += 1;
    playerId = counter % playerCount;

    // Skip players with 0 HP
    while (team.players[playerId].hp <= 0) {
      playerId = (playerId + 1) % playerCount;
    }

    const currentPlayer = team.players[playerId];
    team.setActivePlayer(currentPlayer);
    currentPlayer.defending = move === PlayerAction.Def.toLocaleUpperCase();

    if (currentPlayer.name === "Kazuma") {
      //reset defend status to everyone
      team.players.forEach(p => {
        if (p.name !== "Kazuma") {
          p.defending = false;
          p.performAction(PlayerAction.Idle);
        }
      });
    }

    if (currentPlayer.defending) {
      const dmg = rand.randint(currentPlayer.attack[0], currentPlayer.attack[1]);
      const rng = rand.randint(0, linesTyped[lang as Lang].youDefendMsgs[playerId].length - 1);
      const msg = linesTyped[lang as Lang].youDefendMsgs[playerId][rng]
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());

      const desc = descriptionsTyped[lang as Lang].youDefendMsgs[playerId][rng]
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());

      messages.push(msg);
      embedDescription.push(desc);
      currentPlayer.performAction(PlayerAction.Def);
    } else if (move === PlayerAction.Atk.toLocaleUpperCase()) {
      const dmg = rand.randint(currentPlayer.attack[0], currentPlayer.attack[1]);
      creature.dealAttack(dmg);
      const rng = rand.randint(0, linesTyped[lang as Lang].youAttackMsgs[playerId].length - 1);
      const msg = linesTyped[lang as Lang].youAttackMsgs[playerId][rng]
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());
      const desc = descriptionsTyped[lang as Lang].youAttackMsgs[playerId][rng]
        .replace("CREATURE", creature.name)
        .replace("DAMAGE", dmg.toString());
      embedDescription.push(desc);
      messages.push(msg);
      currentPlayer.performAction(PlayerAction.Atk);
    } else if (move === PlayerAction.Hug.toLocaleUpperCase()) {
      const rng = rand.randint(0, linesTyped[lang as Lang].youHugMsgs[playerId].length - 1);
      const msg = linesTyped[lang as Lang].youHugMsgs[playerId][rng]
        .replace("CREATURE", creature.name);

      embedDescription.push(descriptionsTyped[lang as Lang].youHugMsgs[playerId][rng].replace("CREATURE", creature.name));
      messages.push(msg);
      const loveDecrease = rand.randint(1, 4);
      creature.giveHug(loveDecrease);
      currentPlayer.performAction(PlayerAction.Hug);
    } else if (move === PlayerAction.Hea.toLocaleUpperCase() && currentPlayer.name === "Aqua") {
      currentPlayer.performAction(PlayerAction.Hug);
      (currentPlayer as Aqua).heal(team);
      const rng = rand.randint(0, linesTyped[lang as Lang].aquaHealMsgs.length - 1);
      const msg = linesTyped[lang as Lang].aquaHealMsgs[rng];
      const desc = descriptionsTyped[lang as Lang].aquaHealMsgs[rng];
      messages.push(msg);
      embedDescription.push(desc);
    } else if (move === PlayerAction.Spe.toLocaleUpperCase()) {
      const dmg = rand.randint(currentPlayer.attack[0], currentPlayer.attack[1]);
      if (currentPlayer.specialAttackReady) {
        const specialDmgMultiplier = rand.randint(2, 4);
        const totalDmg = dmg * specialDmgMultiplier;
        creature.dealAttack(totalDmg);
        currentPlayer.performAction(PlayerAction.Spe);
        const rng = rand.randint(0, linesTyped[lang as Lang].youSpecialAttackMsgs[playerId].length - 1);
        const msg = linesTyped[lang as Lang].youSpecialAttackMsgs[playerId][rng]
          .replace("CREATURE", creature.name)
          .replace("DAMAGE", totalDmg.toString());
        const desc = descriptionsTyped[lang as Lang].youSpecialAttackMsgs[playerId][rng]
          .replace("CREATURE", creature.name)
          .replace("DAMAGE", totalDmg.toString());
        embedDescription.push(desc);
        messages.push(msg);
      }
      else {
        // Normal attack if special attack is not ready
        creature.dealAttack(dmg);
        const rng = rand.randint(0, linesTyped[lang as Lang].youAttackMsgs[playerId].length - 1);
        const msg = linesTyped[lang as Lang].youAttackMsgs[playerId][rng]
          .replace("CREATURE", creature.name)
          .replace("DAMAGE", dmg.toString());
        const desc = descriptionsTyped[lang as Lang].youAttackMsgs[playerId][rng]
          .replace("CREATURE", creature.name)
          .replace("DAMAGE", dmg.toString());
        embedDescription.push(desc);
        messages.push(msg);
        currentPlayer.performAction(PlayerAction.Atk);
      }
    }

    if (creature.hp <= 0) {
      state = GameState.Good;
      break;
    }

    if (creature.love <= 0) {
      state = GameState.Best;
      break;
    }

    // Creature's turn
    // Attacks only after Aqua's 
    if (currentPlayer.name !== "Aqua") {
      continue;
    }

    const randomPlayer = rand.choice(team.players.filter(p => p.hp > 0));
    const creatureMove = creature.turn({ lang, dmg: rand.randint(creature.attack[0], creature.attack[1]), player: randomPlayer });

    if (randomPlayer.defending) {
      messages.push(
        lang === Lang.French
          ? MessagesTemplates.French_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.French_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString()).replace("{PLAYER}", randomPlayer.name)
          : MessagesTemplates.English_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.English_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString()).replace("{PLAYER}", randomPlayer.name)
      );
      embedDescription.push(
        lang === Lang.French
          ? MessagesTemplates.French_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.French_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString()).replace("{PLAYER}", randomPlayer.name)
          : MessagesTemplates.English_CreatureMisses.replace("${NAME}", creature.prefix ? Prefix.English_Determined + creature.name : creature.name).replace("{DMG}", creatureMove[1].toString()).replace("{PLAYER}", randomPlayer.name)
      );
    } else {
      randomPlayer.hp -= creatureMove[1];
      if (randomPlayer.hp > 0) {
        messages.push(creatureMove[0]);
        embedDescription.push(creatureMove[0]);
      } else {
        messages.push(
          lang === Lang.French
            ? `${creatureMove[0]} ${randomPlayer.name} est à terre...`
            : `${creatureMove[0]} ${randomPlayer.name} is down...`
        );
        embedDescription.push(
          lang === Lang.French
            ? `${creatureMove[0]} ${randomPlayer.name} est à terre...`
            : `${creatureMove[0]} ${randomPlayer.name} is down...`
        );
      }
    }

    const teamHP = team.players.reduce((sum, player) => sum + player.hp, 0);
    if (teamHP <= 0) {
      state = GameState.Bad;
      break;
    }

    if (move === "GIV") {
      state = GameState.Giveup;
      break;
    }

    if (state !== GameState.Incomplete) {
      break; // Exit the loop if the game has ended
    }
  }

  const training = !!monsterName;
  if (state === null && moves.length > 0) state = GameState.Incomplete;
  if (state === GameState.Good) embedDescription.push(lang === Lang.French ? EndMessages.French_Good: EndMessages.English_Good);
  if (state === GameState.Bad) embedDescription.push(lang === Lang.French ? EndMessages.French_Bad: EndMessages.English_Bad);
  if (state === GameState.Best) embedDescription.push(lang === Lang.French ? EndMessages.French_Best: EndMessages.English_Best);
  if (state === GameState.Giveup) embedDescription.push(lang === Lang.French ? EndMessages.French_Giveup: EndMessages.English_Giveup);
  if (state !== GameState.Incomplete) embedDescription[embedDescription.length - 1] += creature.name + (lang === Lang.French ? EndMessages.French_ExclamationMark : EndMessages.English_ExclamationMark);
  if (renderingImage) {
    const image = await renderImage(state, messages, team, creature, lang);
    return { image, state, messages, embedDescription, team, creature, training };
  } else {
    return { state, messages, embedDescription, team, creature, training };
  }
}

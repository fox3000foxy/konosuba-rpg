import { Errors } from "../enums/Errors";
import { Prefix } from "../enums/Prefix";
import { Player } from "./Player";

export enum MessagesTemplates {
  French_CreatureAttacks = "${NAME} attaque {PLAYER} et lui inflige {DMG} DMG.",
  French_CreatureMisses = "${NAME} a essayé d'attaquer {PLAYER} mais l'a donc raté.",
  English_CreatureAttacks = "${NAME} attacks {PLAYER} and deal {DMG} DMG.",
  English_CreatureMisses = "${NAME} tried to attack {PLAYER} but missed.",
}

export interface CreatureInterface {
  hpMax: number;
  hp: number;
  attack: number[];
  love: number;
  name: string[];
  images: string[];
  color?: string;
  prefix: boolean;
  lore: string;
  gender: "male" | "female" | "neutral";
}

export abstract class Creature implements CreatureInterface {
  public hpMax: number;
  public hp: number;
  public attack: number[];
  public love: number;
  public name: string[];
  public images: string[];
  public color?: string;
  public prefix: boolean;
  public lore: string;
  public gender: "male" | "female" | "neutral";

  constructor() {
    this.hpMax = 10;
    this.hp = this.hpMax;
    this.attack = [0, 12];
    this.love = 10;
    this.name = ["Creature", "Créature"];
    this.images = ["frame"];
    this.prefix = true;
    this.lore = "";
    this.gender = "neutral";

    if (new.target === Creature) {
      throw new Error(Errors.ABSTRACT_ERROR);
    }
  }

  giveHug(loveDecrease: number) {
    this.love -= loveDecrease;
  }

  turn(options: {
    lang: string;
    dmg: number;
    player: Player;
  }): [string, number] {
    const dmg = options.dmg;
    const isFrench = options.lang === "fr";
    const langIndex = isFrench ? 1 : 0;
    const creatureGender = this.gender;
    const name = this.name[langIndex];
    const creaturePrefix = this.prefix
      ? isFrench
        ? creatureGender === "female"
          ? Prefix.French_Determined_Feminine
          : Prefix.French_Determined_Masculine
        : Prefix.English_Determined
      : Prefix.None;

    const template = isFrench
      ? dmg
        ? MessagesTemplates.French_CreatureAttacks
        : MessagesTemplates.French_CreatureMisses
      : dmg
        ? MessagesTemplates.English_CreatureAttacks
        : MessagesTemplates.English_CreatureMisses;

    const message = template
      .replace("${NAME}", `${creaturePrefix}${name}`)
      .replace("{DMG}", dmg.toString())
      .replace("{PLAYER}", options.player.name[langIndex]);

    return [message, dmg];
  }

  dealAttack(dmg: number) {
    this.hp -= dmg;
  }
}

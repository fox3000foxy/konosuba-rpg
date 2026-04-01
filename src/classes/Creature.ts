import { Errors } from '../objects/enums/Errors';
import { Gender } from '../objects/enums/Gender';
import { MessagesTemplates } from '../objects/enums/MessagesTemplates';
import { Prefix } from '../objects/enums/Prefix';
import { CreatureInterface } from '../objects/types/CreatureInterface';
import { Player } from './Player';

export { MessagesTemplates } from '../objects/enums/MessagesTemplates';
export type { CreatureInterface } from '../objects/types/CreatureInterface';

export abstract class Creature implements CreatureInterface {
  public hpMax: number;
  public hp: number;
  public attack: number[];
  public love: number;
  public name: string[];
  public images: string[];
  public color?: string;
  public prefix: boolean;
  public lore: string[];
  public gender: Gender;

  constructor() {
    this.hpMax = 10;
    this.hp = this.hpMax;
    this.attack = [0, 12];
    this.love = 10;
    this.name = ['Creature', 'Créature'];
    this.images = ['frame'];
    this.prefix = true;
    this.lore = ['', ''];
    this.gender = Gender.Neutral;

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
    const isFrench = options.lang === 'fr';
    const langIndex = isFrench ? 1 : 0;
    const creatureGender = this.gender;
    const name = this.name[langIndex];
    const creaturePrefix = this.prefix
      ? isFrench
        ? creatureGender === Gender.Female
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
      .replace('${NAME}', `${creaturePrefix}${name}`)
      .replace('{DMG}', dmg.toString())
      .replace('{PLAYER}', options.player.name[langIndex]);

    return [message, dmg];
  }

  dealAttack(dmg: number) {
    this.hp -= dmg;
  }
}

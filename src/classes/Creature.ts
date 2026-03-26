
import { Errors } from "../enums/Errors";
import { Prefix } from "../enums/Prefix";

export enum MessagesTemplates {
    French_CreatureAttacks = "${NAME} l'attaque et lui inflige {DMG} DMG.",
    French_CreatureMisses = "${NAME} a essayé de l'attaquer mais l'a donc raté.",
    English_CreatureAttacks = "${NAME} attacks and deal {DMG} DMG.",
    English_CreatureMisses = "${NAME} tried to attack but missed.",
}

export interface CreatureInterface {
    hpMax: number;
    hp: number;
    attack: number[];
    love: number;
    name: string;
    images: string[];
    color?: string;
    prefix: boolean;
}

export abstract class Creature implements CreatureInterface {
    public hpMax: number;
    public hp: number;
    public attack: number[];
    public love: number;
    public name: string;
    public images: string[];
    public color?: string;
    public prefix: boolean;

    constructor() {
        this.hpMax = 10;
        this.hp = this.hpMax;
        this.attack = [0, 12];
        this.love = 10;
        this.name = "Creature";
        this.images = ["frame"];
        this.prefix = true;

        if (new.target === Creature) {
            throw new Error(Errors.ABSTRACT_ERROR);
        }
    }

    giveHug(loveDecrease: number) {
        this.love -= loveDecrease;
    }

    turn(options: { lang: string, dmg: number }): [string, number] {
        const dmg = options.dmg;
        switch (options.lang) {
            case "fr":
                if (dmg)
                    return [MessagesTemplates.French_CreatureAttacks.replace("${NAME}", `${this.prefix ? Prefix.French_Determined : Prefix.None}${this.name}`).replace("{DMG}", dmg.toString()), dmg];
                else
                    return [MessagesTemplates.French_CreatureMisses.replace("${NAME}", `${this.prefix ? Prefix.French_Determined : Prefix.None}${this.name}`).replace("{DMG}", dmg.toString()), dmg];
            case "en":
            default:
                if (dmg)
                    return [MessagesTemplates.English_CreatureAttacks.replace("${NAME}", `${this.prefix ? Prefix.English_Determined : Prefix.None}${this.name}`).replace("{DMG}", dmg.toString()), dmg];
                else
                    return [MessagesTemplates.English_CreatureMisses.replace("${NAME}", `${this.prefix ? Prefix.English_Determined : Prefix.None}${this.name}`).replace("{DMG}", dmg.toString()), dmg];
        }
    }

    dealAttack(dmg: number) {
        this.hp -= dmg;
    }
}

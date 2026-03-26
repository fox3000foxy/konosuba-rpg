
import { Errors } from "../enums/Errors";
import { Prefix } from "../enums/Prefix";
import { Random } from "./Random";

export enum MessagesTemplates {
    French_CreatureAttacks = "${NAME} l'attaque et lui inflige {DMG} DMG.",
    French_CreatureMisses = "${NAME} a essayé de l'attaquer mais l'a donc raté.",
    English_CreatureAttacks = "${NAME} attacks and deal {DMG} DMG.",
    English_CreatureMisses = "${NAME} tried to attack but missed.",
}

export class Creature {
    rand: Random;
    hpMax: number;
    hp: number;
    attack: number[];
    love: number;
    name: string;
    images: string[];
    color?: string;
    prefix: boolean;

    constructor(rand: Random) {
        this.rand = rand;
        this.hpMax = 10;
        this.hp = this.hpMax;
        this.attack = [0, 12];
        this.love = 10;
        this.name = "Creature";
        this.images = ["frame"];
        this.prefix = true

        if (new.target === Creature) {
            throw new Error(Errors.ABSTRACT_ERROR);
        }
    }

    giveHug() {
        this.love -= this.rand.randint(1, 5);
    }

    turn(lang: string): [string, number] {
        const dmg = this.rand.randint(this.attack[0], this.attack[1]);
        switch (lang) {
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

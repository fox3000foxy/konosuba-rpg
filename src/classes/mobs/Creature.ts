import { Random } from "../Random";

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
    }

    giveHug() {
        this.love -= this.rand.randint(1, 5);
    }

    turn(lang: string): [string, number] {
        const dmg = this.rand.randint(this.attack[0], this.attack[1]);
		if(lang=="fr")
			if(dmg)
				return [`${this.prefix?"Le ":""}${this.name} l'attaque et lui inflige ${dmg} dégats.`, dmg];
			else
				return [`${this.prefix?"Le ":""}${this.name} a essayé de l'attaquer mais l'a donc raté.`, dmg];
		else
			if(dmg)
				return [`${this.prefix?"The ":""}${this.name} attacks and deal ${dmg} DMG.`, dmg];
			else
				return [`${this.prefix?"The ":""}${this.name} tried to attack but missed.`, dmg];
    }

    dealAttack(dmg: number) {
        this.hp -= dmg;
    }
}

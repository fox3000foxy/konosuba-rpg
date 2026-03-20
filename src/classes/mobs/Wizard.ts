import { Creature } from "./Creature";
export default class Wizard extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [0, 10];
        this.love = 100;
        this.hpMax = 50;
        this.hp = this.hpMax;
        this.name = "Sorcier";
        this.color = rand.choice(["16100", "16101", "16102", "16103", "16104"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}
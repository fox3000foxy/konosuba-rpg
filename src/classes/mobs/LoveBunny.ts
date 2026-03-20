import { Creature } from "./Creature";
export default class LoveBunny extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [0, 10];
        this.love = 20;
        this.hpMax = 20;
        this.hp = this.hpMax;
        this.name = "Love Bunny";
        this.color = rand.choice(["16001", "16002", "16003"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}
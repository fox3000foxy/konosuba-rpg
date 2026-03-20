import Creature from "./Creature";
export default class Quomodo extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [0, 10];
        this.love = 25;
        this.hpMax = 100;
        this.hp = this.hpMax;
        this.name = "Komodo";
        this.color = rand.choice(["15900", "15904"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}
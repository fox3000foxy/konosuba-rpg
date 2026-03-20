import Creature from "./Creature";
export default class Knight extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [0, 10];
        this.love = 30;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Chevalier maudit";
        this.color = rand.choice(["14800", "14802", "14803"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}
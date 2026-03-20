import Creature from "./Creature";
export default class PigWoman extends Creature {
    constructor(rand: any) {
        super(rand);
        this.attack = [0, 10];
        this.love = 5;
        this.hpMax = 50;
        this.hp = this.hpMax;
        this.name = "Femme cochon";
        this.color = rand.choice(["11101", "11104", "11105", "11102"]);
        this.images = [`enemy_image_${this.color}`];
		this.prefix = true
    }
}

import { Creature, CreatureInterface } from "../Creature";

export default class Vanir extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [6, 14];
        this.love = 30;
        this.hpMax = 1300;
        this.hp = this.hpMax;
        this.name = "Vanir";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_17800`];
		this.prefix = false
    }
}
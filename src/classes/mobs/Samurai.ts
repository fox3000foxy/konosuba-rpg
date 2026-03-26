import { Creature, CreatureInterface } from "../Creature";

export default class Samurai extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [5, 14];
        this.love = 100;
        this.hpMax = 75;
        this.hp = this.hpMax;
        this.name = "Samuraï";
        // this.color = rand.choice(["11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_10901`];
		this.prefix = true
    }
}
import { Creature, CreatureInterface } from "../Creature";

export default class UglySpirit extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [3, 12];
        this.love = 100;
        this.hpMax = 55;
        this.hp = this.hpMax;
        this.name = "Esprit hideux";
        // this.color = rand.choice([<"11000", "11001", "11002", "11003", "11004", "11005", "11006"]);
        this.images = [`enemy_image_21500`,`enemy_image_21501`];
		this.prefix = true
    }
}
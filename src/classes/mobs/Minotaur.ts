import { Creature, CreatureInterface } from "../Creature";

export default class Minotaur extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [2, 8];
        this.love = 100;
        this.hpMax = 70;
        this.hp = this.hpMax;
        this.name = "Minotaur";
        this.images = [`enemy_image_18300`,`enemy_image_18301`];
        this.prefix = true;
    }
}
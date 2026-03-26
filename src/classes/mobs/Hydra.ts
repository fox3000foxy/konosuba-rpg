import { Creature, CreatureInterface } from "../Creature";

export default class Hydra extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [3, 10];
        this.love = 100;
        this.hpMax = 80;
        this.hp = this.hpMax;
        this.name = "Hydre";
        this.images = [`enemy_image_21800`,`enemy_image_21801`];
        this.prefix = true;
    }
}
import { Creature, CreatureInterface } from "../Creature";

export default class Kamachi extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [5, 15];
        this.love = 100;
        this.hpMax = 80;
        this.hp = this.hpMax;
        this.name = "Kamachi Kaiga";
        this.images = [`enemy_image_21200`,`enemy_image_21201`];
        this.prefix = true;
    }
}
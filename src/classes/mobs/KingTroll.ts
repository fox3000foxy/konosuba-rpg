import { Creature, CreatureInterface } from "../Creature";

export default class KingTroll extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [5, 10];
        this.love = 100;
        this.hpMax = 120;
        this.hp = this.hpMax;
        this.name = "Roi Troll";
        this.images = [`enemy_image_10001`,`enemy_image_10004`];
        this.prefix = true;
    }
}
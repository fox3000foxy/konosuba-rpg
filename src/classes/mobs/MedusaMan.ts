import { Creature, CreatureInterface } from "../Creature";

export default class MedusaMan extends Creature implements CreatureInterface {
    constructor() {
        super();
        this.attack = [3, 7];
        this.love = 100;
        this.hpMax = 60;
        this.hp = this.hpMax;
        this.name = "Homme méduse";
        this.images = [`enemy_image_22600`,`enemy_image_22601`];
        this.prefix = true;
    }
}
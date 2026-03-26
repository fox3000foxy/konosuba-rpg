import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";

export default class GeneralWinter extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [9, 17];
        this.love = 40;
        this.hpMax = 230;
        this.hp = this.hpMax;
        this.name = "Général Winter";
        this.images = [`enemy_image_10900`];
		this.prefix = true;
    }
}
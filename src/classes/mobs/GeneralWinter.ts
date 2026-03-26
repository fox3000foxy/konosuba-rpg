import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";

export default class GeneralWinter extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [10, 15];
        this.love = 40;
        this.hpMax = 200;
        this.hp = this.hpMax;
        this.name = "Général Winter";
        this.images = [`enemy_image_10900`];
		this.prefix = true;
    }
}
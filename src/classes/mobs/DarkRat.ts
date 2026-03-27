import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class DarkRat extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [1, 8];
        this.love = 15;
        this.hpMax = 250;
        this.hp = this.hpMax;
        this.name = ["Dark Rat", "Rat Ténébreux"];
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["17500", "17502"]);
        this.images = [`enemy_image_${this.color}`];
        this.lore = "Le Rat Ténébreux est un rongeur mutant infesté d'énergie démoniaque, bien plus dangereux que son apparence ne le laisse supposer. Il vit en colonies souterraines sous les villes et les donjons, grouillant dans l'obscurité en attente de proies isolées. Sa morsure transmet parfois des maladies affaiblissantes qui compliquent les soins des guérisseurs. Peu résistant individuellement, il devient une menace réelle lorsqu'il attaque en groupe.";
        this.gender = "male";
    }
}
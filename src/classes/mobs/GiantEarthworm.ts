import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class GiantEarthworm extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [4, 10];
        this.love = 100;
        this.hpMax = 800;
        this.hp = this.hpMax;
        this.name = ["Giant Earthworm", "Ver de terre Géant"];
        this.prefix = true;
    }

    pickColor(rng: Random) {
        this.color = rng.choice(["11500", "11501", "11503"]);
        this.images = [`enemy_image_${this.color}`];
        this.lore = "Le Ver de Terre Géant est une créature souterraine démesurément grosse qui surgit du sol pour engloutir ses proies entières. Il vit dans les plaines et les champs cultivés, causant d'immenses dommages aux infrastructures agricoles des régions qu'il habite. Sa peau visqueuse dévie une partie des coups tranchants, rendant les épées moins efficaces que les masses ou la magie. Les guildes d'aventuriers classent l'extermination de ces créatures parmi leurs contrats les plus lucratifs.";
        this.gender = "male";
    }
}
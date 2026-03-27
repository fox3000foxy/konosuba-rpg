import { GenericCreature, GenericCreatureInterface } from "../GenericCreature";
import { Random } from "../Random";

export default class SharkMan extends GenericCreature implements GenericCreatureInterface {
    constructor() {
        super();
        this.attack = [6, 14];
        this.love = 100;
        this.hpMax = 1000;
        this.hp = this.hpMax;
        this.name = ["Shark Man", "Homme-Requin"];
        this.prefix = true;
    }

    pickColor(rng: Random): string {
        this.color = rng.choice(["15200", "15201"]);
        this.images = [`enemy_image_${this.color}`];
        this.lore = "L'Homme-Requin est un humanoïde aquatique aux traits de requin, capable de combattre aussi efficacement sur terre que dans l'eau grâce à ses jambes puissantes et ses branchies adaptées. Ses mâchoires en font une arme naturelle redoutable qui peut broyer les boucliers en bois en quelques secondes. Il vit en bandes organisées dans les zones côtières, montant des raids sur les villages de pêcheurs avec une coordination surprenante. Sa rage au combat augmente proportionnellement aux dégâts qu'il subit, en faisant un adversaire encore plus dangereux lorsqu'il est blessé.";
        this.gender = "male";
        return this.color;
    }
}
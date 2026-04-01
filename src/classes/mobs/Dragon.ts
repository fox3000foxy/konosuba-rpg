import { Gender } from '../../objects/enums/Gender';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Dragon
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [12, 20];
    this.love = 80;
    this.hpMax = 5000;
    this.hp = this.hpMax;
    this.name = ['Dragon', 'Dragon'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['15400', '15401', '15402', '15404']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Dragon est l'une des créatures les plus redoutées du monde, dont la seule présence suffit à vider une ville d'aventuriers. Ses écailles résistent à la plupart des armes et sa puissance de feu peut réduire un bataillon en cendres en quelques secondes. Certains dragons possèdent une intelligence quasi humaine et négocient parfois avec les mortels, tandis que d'autres ne vivent que pour la destruction. Affronter un dragon sans préparation relève du suicide pur et simple.";
    this.gender = Gender.Male;
  }
}

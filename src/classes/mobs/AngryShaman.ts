import { Gender } from '../../objects/enums/Gender';
import { Creature } from '../Creature';

export default class AngryShaman extends Creature implements Creature {
  constructor() {
    super();
    this.attack = [5, 12];
    this.love = 100;
    this.hpMax = 500;
    this.hp = this.hpMax;
    this.name = ['Angry Shaman', 'Chaman Énervé'];
    this.images = [`enemy_image_22800`, `enemy_image_22801`];
    this.prefix = true;
    this.lore =
      "Le Chaman Énervé est un sorcier tribal perpétuellement en colère, maîtrisant des rituels de malédiction et d'invocation issus de traditions ancestrales obscures. Il accompagne souvent des groupes de monstres comme meneur spirituel, décuplant leur agressivité par ses incantations. Son tempérament colérique le pousse à attaquer sans réfléchir dès qu'il perçoit une menace. Les aventuriers expérimentés le ciblent en priorité pour désorganiser les rangs ennemis.";
    this.gender = Gender.Male;
  }
}

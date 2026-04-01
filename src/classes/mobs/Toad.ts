import { Gender } from '../../objects/enums/Gender';
import { GenericCreature, GenericCreatureInterface } from '../GenericCreature';
import { Random } from '../Random';

export default class Toad
  extends GenericCreature
  implements GenericCreatureInterface
{
  constructor() {
    super();
    this.attack = [3, 8];
    this.love = 50;
    this.hpMax = 450;
    this.hp = this.hpMax;
    this.name = ['Toad', 'Crapaud'];
    this.prefix = true;
  }

  pickColor(rng: Random) {
    this.color = rng.choice(['16700', '16701', '16702', '16704']);
    this.images = [`enemy_image_${this.color}`];
    this.lore =
      "Le Crapaud est un batracien géant dont la langue collante peut capturer des proies à plusieurs mètres de distance en un éclair. Il vit dans les marécages et les zones humides autour d'Axel, se camouflant parfaitement dans la végétation grâce à sa peau mouchetée. Sa bave est légèrement paralysante au contact, ralentissant les réflexes des aventuriers qui ne prennent pas la précaution de s'en protéger. Les guildes locales proposent régulièrement des contrats d'extermination car sa présence menace les routes commerciales bordant les marais.";
    this.gender = Gender.Male;
  }
}

import { AccessoryId } from '../../objects/enums/AccessoryId';
import { AccessoryType } from '../../objects/enums/AccessoryType';
import { Rarity } from '../../objects/enums/Rarity';

export type AccessoryQuery = {
  rarity?: Rarity;
  type?: AccessoryType;
  name?: string;
  id?: AccessoryId;
  ids?: AccessoryId[];
  limit?: number;
};

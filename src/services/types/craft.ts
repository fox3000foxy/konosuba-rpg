import { ItemId } from '../../objects/enums/ItemId';

export type CraftingRecipeView = {
  key: string;
  resultItemId: ItemId;
  resultNameFr: string;
  resultNameEn: string;
  resultQuantity: number;
  ingredients: Array<{
    itemId: ItemId;
    nameFr: string;
    nameEn: string;
    quantity: number;
  }>;
};

export type CraftRecipeResult = {
  success: boolean;
  reason: 'crafted' | 'recipe_not_found' | 'recipe_disabled' | 'insufficient_ingredients' | 'service_unavailable' | 'internal_error';
  craftedItemId?: ItemId;
  craftedQuantity?: number;
  missingIngredients?: Array<{
    itemId: ItemId;
    required: number;
    available: number;
  }>;
};

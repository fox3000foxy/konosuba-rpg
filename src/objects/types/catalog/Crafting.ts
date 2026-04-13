import type { ItemId } from "../../enums/ItemId";

export type CraftingIngredient = {
  itemId: ItemId;
  quantity: number;
};

export type CraftingRecipe = {
  key: string;
  resultItemId: ItemId;
  resultQuantity: number;
  ingredients: CraftingIngredient[];
  enabled: boolean;
};

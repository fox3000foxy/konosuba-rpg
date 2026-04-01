import { ItemId } from '../enums/ItemId';

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

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    key: 'potion_fire_basic',
    resultItemId: ItemId.I20001000,
    resultQuantity: 1,
    ingredients: [
      { itemId: ItemId.I20003000, quantity: 1 },
      { itemId: ItemId.I20004001, quantity: 1 },
    ],
    enabled: true,
  },
  {
    key: 'potion_water_basic',
    resultItemId: ItemId.I20001001,
    resultQuantity: 1,
    ingredients: [
      { itemId: ItemId.I20003001, quantity: 1 },
      { itemId: ItemId.I20004002, quantity: 1 },
    ],
    enabled: true,
  },
  {
    key: 'potion_earth_basic',
    resultItemId: ItemId.I20001002,
    resultQuantity: 1,
    ingredients: [
      { itemId: ItemId.I20003002, quantity: 1 },
      { itemId: ItemId.I20004003, quantity: 1 },
    ],
    enabled: true,
  },
];

export const CRAFTING_RECIPE_BY_KEY: Record<string, CraftingRecipe> =
  CRAFTING_RECIPES.reduce<Record<string, CraftingRecipe>>((acc, recipe) => {
    acc[recipe.key] = recipe;
    return acc;
  }, {});

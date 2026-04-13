import { CRAFTING_RECIPES } from "../objects/data/craftingCatalog";
import { ItemId } from "../objects/enums/ItemId";
import { withPerf } from "../utils/perfLogger";
import { getSupabaseAdminClient } from "../utils/supabaseClient";
import { getItemById } from "./consumableService";
import { CraftingRecipeView, CraftRecipeResult } from "./types/craft";

type CraftRecipeRpcRow = {
  success: boolean;
  reason: string;
  crafted_item_key: string | null;
  crafted_quantity: number;
  missing_ingredients: Array<{
    item_key: string;
    required: number;
    available: number;
  }> | null;
};

function mapReason(reason: string): CraftRecipeResult["reason"] {
  switch (reason) {
    case "crafted":
    case "recipe_not_found":
    case "recipe_disabled":
    case "insufficient_ingredients":
    case "internal_error":
      return reason;
    default:
      return "internal_error";
  }
}

export function getCraftingRecipes(): CraftingRecipeView[] {
  return CRAFTING_RECIPES.filter((recipe) => recipe.enabled)
    .map((recipe) => {
      const result = getItemById(recipe.resultItemId);
      if (!result) {
        return null;
      }

      const ingredients = recipe.ingredients
        .map((ingredient) => {
          const item = getItemById(ingredient.itemId);
          if (!item) {
            return null;
          }

          return {
            itemId: ingredient.itemId,
            nameFr: item.nameFr,
            nameEn: item.nameEn,
            quantity: ingredient.quantity,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (ingredients.length !== recipe.ingredients.length) {
        return null;
      }

      return {
        key: recipe.key,
        resultItemId: recipe.resultItemId,
        resultNameFr: result.nameFr,
        resultNameEn: result.nameEn,
        resultQuantity: recipe.resultQuantity,
        ingredients,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export async function craftRecipe(userId: string, recipeKey: string): Promise<CraftRecipeResult> {
  return withPerf("craftService", "craftRecipe", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return {
        success: false,
        reason: "service_unavailable",
      };
    }

    const { data, error } = await supabase.rpc("craft_recipe_atomic", {
      p_user_id: userId,
      p_recipe_key: recipeKey,
    });

    if (error) {
      console.error("[db] craftRecipe failed:", error.message);
      return {
        success: false,
        reason: "internal_error",
      };
    }

    const rows = Array.isArray(data) ? (data as CraftRecipeRpcRow[]) : data ? [data as CraftRecipeRpcRow] : [];

    const row = rows[0];
    if (!row) {
      return {
        success: false,
        reason: "internal_error",
      };
    }

    if (!row.success) {
      const missingIngredients =
        row.missing_ingredients?.map((item) => ({
          itemId: item.item_key as ItemId,
          required: item.required,
          available: item.available,
        })) || [];

      return {
        success: false,
        reason: mapReason(row.reason),
        missingIngredients,
      };
    }

    return {
      success: true,
      reason: "crafted",
      craftedItemId: row.crafted_item_key as ItemId,
      craftedQuantity: Number(row.crafted_quantity || 0),
    };
  });
}

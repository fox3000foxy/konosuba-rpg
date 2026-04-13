import type { Context } from "hono";
import type { InteractionDataOption } from "../../objects/types/InteractionDataOption";
import { craftRecipe, getCraftingRecipes } from "../../services/craftService";
import { ensurePlayerProfile } from "../../services/progressionService";

function getRecipeOption(options: InteractionDataOption[] | undefined): string {
  const value = options?.find((option) => option.name === "recipe")?.value;
  return typeof value === "string" ? value.trim() : "";
}

function recipesHelpText(fr: boolean): string {
  const recipes = getCraftingRecipes();
  if (recipes.length === 0) {
    return fr ? "Aucune recette disponible actuellement." : "No recipe is currently available.";
  }

  const lines = recipes.map((recipe) => {
    const resultName = fr ? recipe.resultNameFr : recipe.resultNameEn;
    const ingredients = recipe.ingredients
      .map((ingredient) => {
        const ingredientName = fr ? ingredient.nameFr : ingredient.nameEn;
        return `${ingredientName} x${ingredient.quantity}`;
      })
      .join(", ");

    return `- ${resultName} x${recipe.resultQuantity} (${ingredients})`;
  });

  return (fr ? "# Recettes disponibles\n\nUtilise `/craft recipe:` puis sélectionne la recette\n\n" : "# Available recipes\n\nUse `/craft recipe:` then select the recipe\n\n") + lines.join("\n");
}

function failureMessage(
  reason: string,
  fr: boolean,
  missingIngredients?: Array<{
    itemId: string;
    required: number;
    available: number;
  }>,
): string {
  if (reason === "insufficient_ingredients" && missingIngredients && missingIngredients.length > 0) {
    const recipes = getCraftingRecipes();
    const missingLines = missingIngredients.map((missing) => {
      // Find the ingredient name from recipes
      let ingredientName = missing.itemId;
      for (const recipe of recipes) {
        const found = recipe.ingredients.find((ing) => ing.itemId === missing.itemId);
        if (found) {
          ingredientName = fr ? found.nameFr : found.nameEn;
          break;
        }
      }

      const needed = missing.required - missing.available;
      return fr ? `- ${ingredientName}: manquent ${needed} (en stock: ${missing.available}/${missing.required})` : `- ${ingredientName}: missing ${needed} (have: ${missing.available}/${missing.required})`;
    });

    const title = fr ? "❌ Ingredients insuffisants:\n" : "❌ Not enough ingredients:\n";

    return title + missingLines.join("\n");
  }

  switch (reason) {
    case "recipe_not_found":
      return fr ? "Recette introuvable." : "Recipe not found.";
    case "recipe_disabled":
      return fr ? "Cette recette est desactivee." : "This recipe is disabled.";
    case "insufficient_ingredients":
      return fr ? "Ingredients insuffisants dans l'inventaire." : "Not enough ingredients in inventory.";
    case "service_unavailable":
      return fr ? "Service de craft indisponible pour le moment." : "Craft service is currently unavailable.";
    default:
      return fr ? "Craft impossible pour le moment." : "Craft failed for now.";
  }
}

export async function handleCraftCommand(c: Context, userId: string, fr: boolean, options?: InteractionDataOption[]) {
  await ensurePlayerProfile(userId);

  const recipeKey = getRecipeOption(options);
  if (!recipeKey) {
    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            description: recipesHelpText(fr),
            color: 0x2b2d31,
          },
        ],
      },
    });
  }

  const result = await craftRecipe(userId, recipeKey);
  if (!result.success || !result.craftedItemId) {
    return c.json({
      type: 4,
      data: {
        content: failureMessage(result.reason, fr, result.missingIngredients),
        flags: 1 << 6,
      },
    });
  }

  const recipes = getCraftingRecipes();
  const crafted = recipes.find((recipe) => recipe.resultItemId === result.craftedItemId);
  const craftedName = crafted ? (fr ? crafted.resultNameFr : crafted.resultNameEn) : result.craftedItemId;

  let successMessage: string;
  if (crafted && fr) {
    const consumedItems = crafted.ingredients.map((ing) => `${ing.nameFr} x${ing.quantity}`).join(", ");
    successMessage = `✅ Craft reussi\n- Consommé: ${consumedItems}\n- Ajouté: ${craftedName} x${result.craftedQuantity || 1}`;
  } else if (crafted) {
    const consumedItems = crafted.ingredients.map((ing) => `${ing.nameEn} x${ing.quantity}`).join(", ");
    successMessage = `✅ Craft successful\n- Consumed: ${consumedItems}\n- Added: ${craftedName} x${result.craftedQuantity || 1}`;
  } else {
    successMessage = fr ? `✅ Craft reussi: ${craftedName} x${result.craftedQuantity || 1}` : `✅ Craft successful: ${craftedName} x${result.craftedQuantity || 1}`;
  }

  return c.json({
    type: 4,
    data: {
      content: successMessage,
      flags: 1 << 6,
    },
  });
}

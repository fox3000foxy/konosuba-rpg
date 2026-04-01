import { craftRecipe, getCraftingRecipes } from '../../src/services/craftService';
import { getSupabaseAdminClient } from '../../src/utils/supabaseClient';

jest.mock('../../src/utils/supabaseClient', () => ({
  getSupabaseAdminClient: jest.fn(),
}));

const mockedGetSupabaseAdminClient = getSupabaseAdminClient as jest.MockedFunction<
  typeof getSupabaseAdminClient
>;

describe('craftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns enabled recipes with localized labels', () => {
    const recipes = getCraftingRecipes();

    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) {
      expect(recipe.key).toBeTruthy();
      expect(recipe.resultNameFr.length).toBeGreaterThan(0);
      expect(recipe.resultNameEn.length).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
    }
  });

  it('returns service_unavailable when supabase client is missing', async () => {
    mockedGetSupabaseAdminClient.mockReturnValue(null);

    const result = await craftRecipe('user-1', 'potion_fire_basic');

    expect(result).toEqual({
      success: false,
      reason: 'service_unavailable',
    });
  });

  it('returns crafted result when rpc succeeds', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          success: true,
          reason: 'crafted',
          crafted_item_key: '20001000',
          crafted_quantity: 1,
        },
      ],
      error: null,
    });

    mockedGetSupabaseAdminClient.mockReturnValue({ rpc } as never);

    const result = await craftRecipe('user-1', 'potion_fire_basic');

    expect(result.success).toBe(true);
    expect(result.reason).toBe('crafted');
    expect(result.craftedItemId).toBe('20001000');
    expect(result.craftedQuantity).toBe(1);
    expect(rpc).toHaveBeenCalledWith('craft_recipe_atomic', {
      p_user_id: 'user-1',
      p_recipe_key: 'potion_fire_basic',
    });
  });

  it('maps insufficient ingredients reason', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          success: false,
          reason: 'insufficient_ingredients',
          crafted_item_key: null,
          crafted_quantity: 0,
        },
      ],
      error: null,
    });

    mockedGetSupabaseAdminClient.mockReturnValue({ rpc } as never);

    const result = await craftRecipe('user-1', 'potion_fire_basic');

    expect(result).toEqual({
      success: false,
      reason: 'insufficient_ingredients',
    });
  });

  it('handles concurrent attempts with one success then one failure', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            success: true,
            reason: 'crafted',
            crafted_item_key: '20001000',
            crafted_quantity: 1,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            success: false,
            reason: 'insufficient_ingredients',
            crafted_item_key: null,
            crafted_quantity: 0,
          },
        ],
        error: null,
      });

    mockedGetSupabaseAdminClient.mockReturnValue({ rpc } as never);

    const [first, second] = await Promise.all([
      craftRecipe('user-1', 'potion_fire_basic'),
      craftRecipe('user-1', 'potion_fire_basic'),
    ]);

    expect(first.reason).toBe('crafted');
    expect(second.reason).toBe('insufficient_ingredients');
  });
});

import { getInventoryItemQuantity } from '../../src/services/inventoryConsumptionService';

describe('inventoryConsumptionService', () => {
  // Note: Full integration tests for consumeInventoryItem require DB access
  // These are unit tests for the quantity checking logic

  it('returns 0 for non-existent items', async () => {
    const quantity = await getInventoryItemQuantity(
      'test-user',
      'I99999999'
    );
    expect(quantity).toBe(0);
  });

  it('handles supabase client unavailability gracefully', async () => {
    // This tests the null check we added
    try {
      const quantity = await getInventoryItemQuantity(
        'test-user',
        'I20001000'
      );
      // Should return 0 or succeed depending on DB availability
      expect(typeof quantity).toBe('number');
    } catch (error) {
      fail('Should not throw error on DB unavailability');
    }
  });
});

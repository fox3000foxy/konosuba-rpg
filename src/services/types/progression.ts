export type DonateAccessoryResult = {
  success: boolean;
  affinityPoints: number;
  reason?: "invalid-accessory" | "out-of-stock";
};

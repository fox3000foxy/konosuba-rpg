import { type Context } from "hono";
import { BASE_URL } from "../../objects/config";
import { type AccessoryType } from "../../objects/enums/AccessoryType";
import { Rarity } from "../../objects/enums/Rarity";
import { type InteractionDataOption } from "../../objects/types/InteractionDataOption";
import { getInventoryItems } from "../../services/inventoryService";
import { ensurePlayerProfile } from "../../services/progressionService";
import { addImageVersion } from "../../utils/imageUtils";

type AffinityMessageData = {
  embeds: Array<{
    description: string;
    image: { url: string };
    color: number;
  }>;
  components?: Array<{
    type: number;
    components: Array<Record<string, unknown>>;
  }>;
};

type AffinityFilterSelection = {
  accessoryType?: AccessoryType;
  rarity?: Rarity;
};

type AffinityComponents = Array<{
  type: number;
  components: Array<Record<string, unknown>>;
}>;

function emojiForRarity(rarity: string | null): string {
  switch (rarity) {
    case "epic":
      return "🌟";
    case "gold":
      return "⭐";
    case "silver":
      return "✨";
    case "bronze":
      return "🔸";
    default:
      return "🎁";
  }
}

function rarityLabel(rarity: Rarity, fr: boolean): string {
  if (!fr) {
    return rarity;
  }

  switch (rarity) {
    case "bronze":
      return "bronze";
    case "silver":
      return "argent";
    case "gold":
      return "or";
    case "epic":
      return "epique";
    case "basic":
      return "basique";
    default:
      return rarity;
  }
}

function typeLabel(type: AccessoryType, fr: boolean): string {
  if (!fr) {
    return type;
  }

  switch (type) {
    case "ring":
      return "bague";
    case "earring":
      return "boucle";
    case "necklace":
      return "collier";
    case "charm":
      return "charme";
    case "ornament":
      return "ornement";
    default:
      return type;
  }
}

export async function handleAffinityCommand(c: Context, userID: string, fr: boolean, options?: InteractionDataOption[]) {
  const mentioned = options?.find((option) => option.name === "mention")?.value;
  const targetUserId = mentioned ? String(mentioned) : userID;

  if (targetUserId === userID) {
    await ensurePlayerProfile(userID);
  }

  const data = await buildAffinityMessageData(userID, targetUserId, fr);

  return c.json({
    type: 4,
    data,
  });
}

export async function buildAffinityMessageData(userID: string, targetUserId: string, fr: boolean, statusLine?: string, filters?: AffinityFilterSelection, forceImageRefresh = true): Promise<AffinityMessageData> {
  const lang = fr ? "fr" : "en";
  const baseImageUrl = `${BASE_URL}/affinity/${targetUserId}?lang=${lang}`;
  const imageUrl = forceImageRefresh ? addImageVersion(baseImageUrl) : baseImageUrl;
  console.log(`Generated affinity image URL: ${imageUrl}`);

  const starsRule = fr ? "Etoiles: 1 etoile tous les 20 points d'affinite (max 5)." : "Stars: 1 star every 20 affinity points (max 5).";
  const rarityRule = fr ? "Rarete -> affinite: bronze +3, silver +5, gold +8, epic +12." : "Rarity -> affinity: bronze +3, silver +5, gold +8, epic +12.";

  const canDonate = targetUserId === userID;
  const components = canDonate ? await buildAffinityGiftComponents(userID, fr, filters) : [];

  const donateHint = canDonate ? (fr ? "\nUtilise les boutons ci-dessous pour offrir un accessoire et gagner de l'affinite." : "\nUse the buttons below to gift an accessory and gain affinity.") : "";

  const status = statusLine ? `\n\n${statusLine}` : "";

  return {
    embeds: [
      {
        description: fr ? `# Affinite de <@${targetUserId}>\n${starsRule}\n${rarityRule}${donateHint}${status}` : `# <@${targetUserId}> affinity\n${starsRule}\n${rarityRule}${donateHint}${status}`,
        image: { url: imageUrl },
        color: 0x2b2d31,
      },
    ],
    ...(components.length > 0 ? { components } : {}),
  };
}

export async function buildAffinityGiftComponents(userID: string, fr: boolean, filters?: AffinityFilterSelection): Promise<AffinityComponents> {
  const components: AffinityComponents = [];
  const items = await getInventoryItems(userID);
  const accessories = items.filter((item) => item.category === "accessory" && item.quantity > 0);

  const typeValues: AccessoryType[] = Array.from(new Set(accessories.map((item) => item.accessoryType).filter((type): type is AccessoryType => type !== null))).sort((a, b) => a.localeCompare(b));

  const selectedType = filters?.accessoryType && typeValues.includes(filters.accessoryType) ? filters.accessoryType : undefined;

  const byType = selectedType ? accessories.filter((item) => item.accessoryType === selectedType) : accessories;

  const rarityValues: Rarity[] = Array.from(new Set(byType.map((item) => item.rarity).filter((rarity): rarity is Rarity => rarity !== null)));

  const rarityOrder: Rarity[] = [Rarity.Basic, Rarity.Bronze, Rarity.Silver, Rarity.Gold, Rarity.Epic];
  rarityValues.sort((a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b));

  const selectedRarity = filters?.rarity && rarityValues.includes(filters.rarity) ? filters.rarity : undefined;

  const byRarity = selectedRarity ? byType.filter((item) => item.rarity === selectedRarity) : byType;

  components.push({
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `affinity_select_type:${userID}`,
        placeholder: fr ? "Choisir un type" : "Choose a type",
        min_values: 1,
        max_values: 1,
        options: typeValues.slice(0, 25).map((type) => ({
          label: typeLabel(type, fr),
          value: type,
          default: type === selectedType,
        })),
        disabled: typeValues.length === 0,
      },
    ],
  });

  components.push({
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `affinity_select_rarity:${selectedType || "all"}:${userID}`,
        placeholder: fr ? "Choisir une rarete" : "Choose a rarity",
        min_values: 1,
        max_values: 1,
        options: rarityValues.slice(0, 25).map((rarity) => ({
          label: rarityLabel(rarity, fr),
          value: rarity,
          default: rarity === selectedRarity,
        })),
        disabled: rarityValues.length === 0,
      },
    ],
  });

  components.push({
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `affinity_select_item:${selectedType || "all"}:${selectedRarity || "all"}:${userID}`,
        placeholder: fr ? "Choisir un accessoire" : "Choose an accessory",
        min_values: 1,
        max_values: 1,
        options: byRarity.slice(0, 25).map((item) => ({
          label: `${emojiForRarity(item.rarity)} ${fr ? item.nameFr : item.nameEn}`.slice(0, 100),
          value: item.itemKey,
          description: `x${item.quantity}`,
        })),
        disabled: byRarity.length === 0,
      },
    ],
  });

  return components;
}

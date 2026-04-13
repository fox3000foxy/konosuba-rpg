import { CONSUMABLE_DEFINITIONS } from "../objects/data/consumablesCatalog";
import { type ItemId } from "../objects/enums/ItemId";
import { type ConsumableDefinition } from "../objects/types/catalog/Consumable";
import { findItemByName, matchesName } from "../utils/itemSearch";
import { type ConsumableQuery } from "./types/consumable";

export function getItemById(id: ItemId): ConsumableDefinition | null {
  return CONSUMABLE_DEFINITIONS.find((item) => item.id === id) || null;
}

export function getItemByName(name: string): ConsumableDefinition | null {
  return findItemByName(CONSUMABLE_DEFINITIONS, name);
}

export function getItems(query: ConsumableQuery = {}): ConsumableDefinition[] {
  const { rarity, type, name, id, ids, limit } = query;

  let items = [...CONSUMABLE_DEFINITIONS];

  if (id) {
    items = items.filter((item) => item.id === id);
  }

  if (ids && ids.length > 0) {
    const lookup = new Set(ids);
    items = items.filter((item) => lookup.has(item.id));
  }

  if (rarity) {
    items = items.filter((item) => item.rarity === rarity);
  }

  if (type) {
    items = items.filter((item) => item.type === type);
  }

  if (name?.trim()) {
    items = items.filter((item) => matchesName(item, name));
  }

  if (typeof limit === "number" && limit > 0) {
    return items.slice(0, limit);
  }

  return items;
}

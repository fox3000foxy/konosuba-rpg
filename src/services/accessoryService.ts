import { ACCESSORY_DEFINITIONS } from "../objects/data/accessoriesCatalog";
import { AccessoryId } from "../objects/enums/AccessoryId";
import { AccessoryDefinition } from "../objects/types/catalog/Accessory";
import { findItemByName, matchesName } from "../utils/itemSearch";
import { AccessoryQuery } from "./types/accessory";

export function getItemById(id: AccessoryId): AccessoryDefinition | null {
  return ACCESSORY_DEFINITIONS.find((item) => item.id === id) || null;
}

export function getItemByName(name: string): AccessoryDefinition | null {
  return findItemByName(ACCESSORY_DEFINITIONS, name);
}

export function getItems(query: AccessoryQuery = {}): AccessoryDefinition[] {
  const { rarity, type, name, id, ids, limit } = query;

  let items = [...ACCESSORY_DEFINITIONS];

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

  if (name && name.trim()) {
    items = items.filter((item) => matchesName(item, name));
  }

  if (typeof limit === "number" && limit > 0) {
    return items.slice(0, limit);
  }

  return items;
}

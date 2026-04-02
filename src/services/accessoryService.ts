import { ACCESSORY_DEFINITIONS } from '../objects/data/accessoriesCatalog';
import { AccessoryId } from '../objects/enums/AccessoryId';
import { AccessoryDefinition } from '../objects/types/catalog/Accessory';
import { AccessoryQuery } from './types/accessory';

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const matchesName = (item: AccessoryDefinition, name: string): boolean => {
  const n = normalizeText(name);
  const fields = [item.id, item.fileName, item.nameFr, item.nameEn].map(value =>
    normalizeText(String(value))
  );

  return fields.some(field => field.includes(n));
};

export function getItemById(id: AccessoryId): AccessoryDefinition | null {
  return ACCESSORY_DEFINITIONS.find(item => item.id === id) || null;
}

export function getItemByName(name: string): AccessoryDefinition | null {
  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  const exact = ACCESSORY_DEFINITIONS.find(item =>
    [item.nameFr, item.nameEn, item.id, item.fileName].some(
      field => normalizeText(String(field)) === normalized
    )
  );

  if (exact) {
    return exact;
  }

  return (
    ACCESSORY_DEFINITIONS.find(item => matchesName(item, normalized)) || null
  );
}

export function getItems(query: AccessoryQuery = {}): AccessoryDefinition[] {
  const { rarity, type, name, id, ids, limit } = query;

  let items = [...ACCESSORY_DEFINITIONS];

  if (id) {
    items = items.filter(item => item.id === id);
  }

  if (ids && ids.length > 0) {
    const lookup = new Set(ids);
    items = items.filter(item => lookup.has(item.id));
  }

  if (rarity) {
    items = items.filter(item => item.rarity === rarity);
  }

  if (type) {
    items = items.filter(item => item.type === type);
  }

  if (name && name.trim()) {
    items = items.filter(item => matchesName(item, name));
  }

  if (typeof limit === 'number' && limit > 0) {
    return items.slice(0, limit);
  }

  return items;
}

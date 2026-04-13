export type SearchableItem = {
  id: string | number;
  fileName: string;
  nameFr: string;
  nameEn: string;
};

type NormalizedFields = {
  id: string;
  fileName: string;
  nameFr: string;
  nameEn: string;
};

const normalizedFieldsCache = new WeakMap<SearchableItem, NormalizedFields>();

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getNormalizedFields(item: SearchableItem): NormalizedFields {
  const cached = normalizedFieldsCache.get(item);
  if (cached) {
    return cached;
  }

  const normalized: NormalizedFields = {
    id: normalizeText(String(item.id)),
    fileName: normalizeText(item.fileName),
    nameFr: normalizeText(item.nameFr),
    nameEn: normalizeText(item.nameEn),
  };

  normalizedFieldsCache.set(item, normalized);
  return normalized;
}

export function matchesName(item: SearchableItem, normalizedName: string): boolean {
  const fields = getNormalizedFields(item);

  return fields.id.includes(normalizedName) || fields.fileName.includes(normalizedName) || fields.nameFr.includes(normalizedName) || fields.nameEn.includes(normalizedName);
}

export function findItemByName<T extends SearchableItem>(items: T[], name: string): T | null {
  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  for (const item of items) {
    const fields = getNormalizedFields(item);
    if (fields.nameFr === normalized || fields.nameEn === normalized || fields.id === normalized || fields.fileName === normalized) {
      return item;
    }
  }

  for (const item of items) {
    if (matchesName(item, normalized)) {
      return item;
    }
  }

  return null;
}

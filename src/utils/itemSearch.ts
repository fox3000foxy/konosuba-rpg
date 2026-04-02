export type SearchableItem = {
  id: string | number;
  fileName: string;
  nameFr: string;
  nameEn: string;
};

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesName(item: SearchableItem, name: string): boolean {
  const normalizedName = normalizeText(name);
  const fields = [item.id, item.fileName, item.nameFr, item.nameEn].map(value =>
    normalizeText(String(value))
  );

  return fields.some(field => field.includes(normalizedName));
}

export function findItemByName<T extends SearchableItem>(items: T[], name: string): T | null {
  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  const exact = items.find(item =>
    [item.nameFr, item.nameEn, item.id, item.fileName].some(
      field => normalizeText(String(field)) === normalized
    )
  );

  if (exact) {
    return exact;
  }

  return items.find(item => matchesName(item, normalized)) || null;
}

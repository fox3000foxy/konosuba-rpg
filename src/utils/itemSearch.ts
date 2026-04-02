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

export function matchesName(item: SearchableItem, normalizedName: string): boolean {
  const fields = [
    normalizeText(String(item.id)),
    normalizeText(item.fileName),
    normalizeText(item.nameFr),
    normalizeText(item.nameEn),
  ];

  return fields.some(field => field.includes(normalizedName));
}

export function findItemByName<T extends SearchableItem>(items: T[], name: string): T | null {
  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  // Pré-calculer les chaînes normalisées pour éviter les conversions répétées
  type ItemIndex = {
    item: T;
    exact: string[];
    fuzzy: string[];
  };

  const indexed: ItemIndex[] = items.map(item => {
    const idNorm = normalizeText(String(item.id));
    const fileNameNorm = normalizeText(item.fileName);
    const nameFrNorm = normalizeText(item.nameFr);
    const nameEnNorm = normalizeText(item.nameEn);

    return {
      item,
      exact: [nameFrNorm, nameEnNorm, idNorm, fileNameNorm],
      fuzzy: [idNorm, fileNameNorm, nameFrNorm, nameEnNorm],
    };
  });

  const exact = indexed.find(i => i.exact.some(field => field === normalized));
  if (exact) {
    return exact.item;
  }

  const fuzzy = indexed.find(i => i.fuzzy.some(field => field.includes(normalized)));
  return fuzzy ? fuzzy.item : null;
}

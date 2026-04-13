import { Creature } from "../classes/Creature";
import { Gender } from "../objects/enums/Gender";
import { Lang } from "../objects/enums/Lang";
import { Prefix } from "../objects/enums/Prefix";

function isFrench(lang: string | Lang): boolean {
  return lang === Lang.French || lang === "fr";
}

function startsWithFrenchElisionLetter(value: string): boolean {
  const firstChar = value.trim().charAt(0).toLowerCase();
  return /^[aàâäæeéèêëiîïoôœuùûüyh]$/.test(firstChar);
}

export function getCreatureDisplayName(creature: Creature, lang: string | Lang): string {
  const langIndex = isFrench(lang) ? 1 : 0;
  return creature.name[langIndex]?.toLowerCase() || creature.constructor.name;
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getCreaturePrefix(creature: Creature, lang: string | Lang, determined: boolean): string {
  if (!creature.prefix) {
    return Prefix.None;
  }

  if (!isFrench(lang)) {
    return Prefix.English_Determined;
  }

  const name = getCreatureDisplayName(creature, lang);
  const article = creature.gender === Gender.Female ? (determined ? Prefix.French_Determined_Feminine : Prefix.French_Undetermined_Feminine) : determined ? Prefix.French_Determined_Masculine : Prefix.French_Undetermined_Masculine;

  return startsWithFrenchElisionLetter(name) ? "L'" : toTitleCase(article);
}

export function getCreatureNameAndPrefix(creature: Creature, lang: string | Lang, determined: boolean): { name: string; prefix: string } {
  return {
    name: getCreatureDisplayName(creature, lang),
    prefix: getCreaturePrefix(creature, lang, determined),
  };
}

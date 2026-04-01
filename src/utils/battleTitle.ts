import { isTraining } from './payloadUtils';

export function buildBattleTitle(
  payload: string,
  fr: boolean,
  userID: string,
  monsterName: string
): string {
  if (isTraining(payload)) {
    return fr
      ? `Entraînement contre ${monsterName}`
      : `Training vs ${monsterName}`;
  }

  return fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`;
}

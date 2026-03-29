/** Utility functions for ID generation and manipulation */

const ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZbcefijklmnopqrstuvwxyz0123456789';
const ID_CHARACTERS_LENGTH = ID_CHARACTERS.length;

/** Generates a random ID of a given length */
export function makeid(length: number): string {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += ID_CHARACTERS.charAt(Math.floor(Math.random() * ID_CHARACTERS_LENGTH));
  }
  return result + '/';
}

/** Clears action letters after the seed/training id segment */
export function restartId(payload: string): string {
  const slashIndex = payload.indexOf('/');
  if (slashIndex === -1) {
    return payload;
  }

  const head = payload.slice(0, slashIndex + 1);
  const actions = payload.slice(slashIndex + 1);
  const cleanedActions = actions.replace(/[adghsp]/g, '');
  return head + cleanedActions;
}

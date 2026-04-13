/** Utility functions for moves compression and decompression */

function splitPayload(payload: string): { head: string; actions: string } {
  const slashIndex = payload.indexOf("/");
  if (slashIndex === -1) {
    return { head: payload, actions: "" };
  }

  return {
    head: payload.slice(0, slashIndex + 1),
    actions: payload.slice(slashIndex + 1),
  };
}

/** Compresses a string of moves */
export function compressMoves(moves: string): string {
  if (moves.length < 2) {
    return moves;
  }

  const { head, actions } = splitPayload(moves);
  if (actions.length < 2) {
    return moves;
  }

  let result = "";
  let count = 1;

  for (let i = 1; i <= actions.length; i += 1) {
    if (actions[i] === actions[i - 1]) {
      count += 1;
    } else {
      result += actions[i - 1] + (count > 1 ? String(count) : "");
      count = 1;
    }
  }

  return head + result;
}

/** Decompresses a compressed string of moves */
export function decompressMoves(comp: string): string {
  const { head, actions } = splitPayload(comp);
  if (actions.length === 0) {
    return comp;
  }

  let result = "";
  let i = 0;

  while (i < actions.length) {
    const char = actions[i];
    i += 1;

    let count = 0;
    while (i < actions.length && actions[i] >= "0" && actions[i] <= "9") {
      count = count * 10 + (actions.charCodeAt(i) - 48);
      i += 1;
    }

    result += char.repeat(count > 0 ? count : 1);
  }

  return head + result;
}

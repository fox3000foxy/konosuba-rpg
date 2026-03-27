/** Utility functions for moves compression and decompression */

/** Compresses a string of moves */
export function compressMoves(moves: string): string {
  return moves.replace(/(.)\1+/g, (match, char) => `${char}${match.length}`);
}

/** Decompresses a compressed string of moves */
export function decompressMoves(comp: string): string {
  // eslint-disable-next-line security/detect-unsafe-regex
  return comp.replace(/([a-z])(\d+)?/g, (_, char, num) => char.repeat(num ? parseInt(num, 10) : 1));
}

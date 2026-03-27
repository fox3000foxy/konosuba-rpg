export class Random {
  private S: number[];
  private i: number;
  private j: number;

  constructor(seed?: number) {
    this.S = new Array(256);
    for (let i = 0; i < 256; i += 1) {
      this.S[i] = i;
    }
    this.i = 0;
    this.j = 0;

    let j = 0;
    let workingSeed = seed || Date.now();
    for (let i = 0; i < 256; i += 1) {
      j = (j + this.S[i] + (workingSeed & 0xff)) & 0xff;
      const tmp = this.S[i];
      this.S[i] = this.S[j];
      this.S[j] = tmp;
      workingSeed >>>= 8;
    }
  }

  next(): number {
    this.i = (this.i + 1) & 0xff;
    this.j = (this.j + this.S[this.i]) & 0xff;

    const tmp = this.S[this.i];
    this.S[this.i] = this.S[this.j];
    this.S[this.j] = tmp;

    return this.S[(this.S[this.i] + this.S[this.j]) & 0xff] / 256;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

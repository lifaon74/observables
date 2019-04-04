export class CyclicIndex {
  public readonly length: number;
  public readIndex: number;
  public writeIndex: number;

  constructor(length: number) {
    if (length < 1) {
      throw new RangeError(`Expected length greater than 1.`);
    }
    this.length = length;
    this.readIndex = 0;
    this.writeIndex = 0;
  }

  readable(): number {
    const readable: number = (this.writeIndex - this.readIndex);
    return (readable < 0)
      ? (readable + this.length)
      : readable;
  }

  writable(): number {
    return (this.readIndex - this.writeIndex + this.length - 1) % this.length;
  }

  read(length: number = 1): void {
    if (length < 1) {
      throw new RangeError(`Expected length greater than 1.`);
    } else if (this.readable() >= length) {
      this.readIndex = (this.readIndex + length) % this.length;
    } else {
      throw new Error(`Not readable`);
    }
  }

  write(length: number = 1, force: number = 0): void {
    if (length < 1) {
      throw new RangeError(`Expected length greater than 1.`);
    } else if (this.writable() >= length) {
      this.writeIndex = (this.writeIndex + length) % this.length;
    } else if (force > 0) {
      this.writeIndex = (this.writeIndex + length) % this.length;
      this.readIndex = (this.writeIndex + force) % this.length;
    } else {
      throw new Error(`Not writable`);
    }
  }

  relativeReadIndex(offset: number): number {
    const readable: number = this.readable();
    const readIndex: number = (this.readIndex + offset) % readable;
    return (readIndex < 0)
      ? (readIndex + readable)
      : readIndex;
  }

  reset(): void {
    this.readIndex = 0;
    this.writeIndex = 0;
  }
}

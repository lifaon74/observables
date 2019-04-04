import { TArrayBufferView } from '../interfaces';
import { CyclicIndex } from './CyclicIndex';

export class CyclicTypedVectorArray<T extends TArrayBufferView> {
  public array: T;
  public vectorLength: number;
  public index: CyclicIndex;

  constructor(array: T, vectorLength: number) {
    this.array = array;
    this.vectorLength = vectorLength;
    this.index = new CyclicIndex(this.array.length);
  }

  readable(): number {
    return this.index.readable();
  }

  writable(): number {
    return this.index.writable();
  }

  read(output?: T): T {
    const index: number = this.index.readIndex;
    this.index.read(this.vectorLength);
    const data: T = this.array.subarray(index, index + this.vectorLength) as T;
    if (output === void 0) {
      return data;
    } else {
      output.set(data);
      return output;
    }
  }

  write(input: T, force: boolean = false): void {
    if (input.length === this.vectorLength) {
      const index: number = this.index.writeIndex;
      this.index.write(this.vectorLength, force ? this.vectorLength : 0);
      this.array.set(input, index);
    } else {
      throw new Error(`Expected an input with length: ${this.vectorLength}`);
    }
  }

  item(index: number): T {
    const _index: number = this.index.relativeReadIndex(index * this.vectorLength);
    return this.array.subarray(_index, _index + this.vectorLength) as T;
  }

  reset(): void {
    this.index.reset();
  }

  toTypedArray(array?: T): T {
    const readable: number = this.readable();
    if (array == void 0) {
      array = new (this.array.constructor as any)(readable);
    } else if (array.length < readable) {
      throw new Error(`Requires bigger array.`);
    }

    if (this.index.writeIndex >= this.index.readIndex) {
      array.set(this.array.subarray(this.index.readIndex, this.index.writeIndex));
    } else {
      array.set(this.array.subarray(this.index.readIndex, this.index.length));
      array.set(this.array.subarray(0, this.index.writeIndex), this.index.length - this.index.readIndex);
    }
    return (array.length > readable)
      ? array.subarray(0, readable) as T
      : array;
  }
}

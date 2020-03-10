import { TAllocFunction } from './memory-address';

export class AbstractMemory {
  public readonly buffer: ArrayBuffer;

  private writeIndex: number;

  constructor(sizeOfBuffer: number /* size */ | ArrayBuffer /* buffer */) {
    this.buffer = (typeof sizeOfBuffer === 'number')
      ? new ArrayBuffer(sizeOfBuffer)
      : sizeOfBuffer;
    this.writeIndex = 0;
  }

  get bytesUsed(): number {
    return this.writeIndex;
  }

  alloc(size: number): number {
    const index: number = this.writeIndex;
    this.writeIndex += size;
    if (this.writeIndex > this.buffer.byteLength) {
      throw new Error(`Alloc failed: not enough memory`);
    }
    return index;
  }

  reset(): void {
    this.writeIndex = 0;
  }

  log(message: string): void {
    console.log(message, this.toUint8Array(0, this.bytesUsed));
  }

  toUint8Array(
    byteOffset: number = 0,
    byteLength: number = this.buffer.byteLength,
  ): Uint8Array {
    return new Uint8Array(this.buffer, byteOffset, byteLength);
  }

  toAllocFunction(): TAllocFunction {
    return (size: number) => {
      return this.alloc(size);
    };
  }
}

export function AllocBiggestBuffer(): ArrayBuffer {
  let min: number = 0;
  let max: number = 2 ** 48;
  let buffer: ArrayBuffer;

  while ((max - min) > 1) {
    const mean = Math.floor((max + min) / 2);
    // console.log('mean', mean);
    try {
      buffer = new ArrayBuffer(mean);
      min = mean;
    } catch {
      max = mean;
    }
  }

  // @ts-ignore
  return buffer;
}

export function LogMemory(
  message: string,
  memory: Uint8Array,
  alloc: TAllocFunction
) {
  console.log(message, memory.slice(0, alloc(0)));
}


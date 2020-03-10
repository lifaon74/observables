
/**
 * Represents a pointer: a data into a memory with a specific address
 *  INFO: most of functions, working on voxels, take as input arguments the tuple [memory, address], which is somehow a MemoryView
 */
export class MemoryView {
  public memory: Uint8Array;
  public address: number;

  constructor(
    memory: Uint8Array,
    address: number,
  ) {
    this.memory = memory;
    this.address = address;
  }
}

// an alloc function takes an size as input (how much bytes we wants to reserve), and returns an address where we may write data
export type TAllocFunction = (size: number) => number;

/*---------------------*/

/**
 * An address is simply a number representing a position into the memory
 */

// number of bytes used to represent an address into the memory (uint32)
export const ADDRESS_BYTES_PER_ELEMENT = 4;

/**
 * Writes an address (value) into the memory
 */
export function WriteAddress(
  memory: Uint8Array,
  address: number,
  value: number
): void {
  // INFO all same perf
  // memory[address    ] = value & 0xff;
  // memory[address + 1] = (value >>> 8) & 0xff;
  // memory[address + 2] = (value >>> 16) & 0xff;
  // memory[address + 3] = (value >>> 24) & 0xff;
  memory[address] = value;
  memory[address + 1] = (value >>> 8);
  memory[address + 2] = (value >>> 16);
  memory[address + 3] = (value >>> 24);
  // memory[address++] = value;
  // memory[address++] = (value >> 8);
  // memory[address++] = (value >> 16);
  // memory[address++] = (value >> 24);
}

/**
 * Reads an address from the memory
 */
export function ReadAddress(
  memory: Uint8Array,
  address: number,
): number {
  return (
    (memory[address])
    | (memory[address + 1] << 8)
    | (memory[address + 2] << 16)
    | (memory[address + 3] << 24)
  ) >>> 0;
}

/**
 * Copies the address at sourceMemory[sourceAddress] into destinationMemory[destinationAddress]
 */
export function CopyAddress(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationMemory: Uint8Array,
  destinationAddress: number,
): void {
  for (let i = 0; i < ADDRESS_BYTES_PER_ELEMENT; i++) {
    destinationMemory[destinationAddress + i] = sourceMemory[sourceAddress + i];
  }
}

/**
 * Returns true if both addresses at memory[address1] and memory2[address2] are equals
 */
export function AreSameAddresses(
  memory1: Uint8Array,
  address1: number,
  memory2: Uint8Array,
  address2: number,
): boolean {
  return /*AreSameMemoriesAndAddresses(memory1, address1, memory2, address2) || */(
    (memory1[address1] === memory2[address2])
    && (memory1[address1 + 1] === memory2[address2 + 1])
    && (memory1[address1 + 2] === memory2[address2 + 2])
    && (memory1[address1 + 3] === memory2[address2 + 3])
  );
}

export function AreSameMemoriesAndAddresses(
  memory1: Uint8Array,
  address1: number,
  memory2: Uint8Array,
  address2: number,
): boolean {
  return (memory1 === memory2)
    && (address1 === address2);
}

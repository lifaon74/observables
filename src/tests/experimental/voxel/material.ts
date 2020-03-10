import { MemoryView, TAllocFunction } from './memory-address';

export const VOXEL_MATERIAL_BYTES_PER_ELEMENT = 5;
export const NO_MATERIAL_ADDRESS = 0xffffffff;


/**
 * Represents a Material: it is used to represent how the light will react with a shape
 *  - [r, g, b, a, reflection]
 */
export class VoxelMaterial extends MemoryView {
  static BYTES_PER_ELEMENT: number = VOXEL_MATERIAL_BYTES_PER_ELEMENT;

  static create(
    memory: Uint8Array,
    alloc: TAllocFunction,
    r: number,
    g: number,
    b: number,
    a: number,
    reflection: number,
  ): VoxelMaterial {
    const voxelMaterial = new VoxelMaterial(memory, alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT));
    CreateVoxelMaterial(voxelMaterial.memory, voxelMaterial.address, r, g, b, a, reflection);
    return voxelMaterial;
  }

  constructor(
    memory: Uint8Array,
    address: number,
  ) {
    super(memory, address);
  }
}


/**
 * Creates a Voxel Material into memory
 */
export function CreateVoxelMaterial(
  memory: Uint8Array,
  address: number,
  r: number,
  g: number,
  b: number,
  a: number,
  reflection: number,
): void {
  memory[address] = r;
  memory[address + 1] = g;
  memory[address + 2] = b;
  memory[address + 3] = a;
  memory[address + 4] = reflection;
}

export function AreSameMaterials(
  memory1: Uint8Array,
  address1: number,
  memory2: Uint8Array,
  address2: number,
): boolean {
  if (
    (memory1 !== memory2)
    || (address1 !== address2)
  ) {
    for (let i = 0; i < VOXEL_MATERIAL_BYTES_PER_ELEMENT; i++) {
      if (memory1[address1 + i] !== memory2[address2 + i]) {
        return false;
      }
    }
  }
  return true;
}

export function CopyMaterial(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationMemory: Uint8Array,
  destinationAddress: number,
): void {
  for (let i = 0; i < VOXEL_MATERIAL_BYTES_PER_ELEMENT; i++) {
    destinationMemory[destinationAddress + i] = sourceMemory[sourceAddress + i];
  }
}


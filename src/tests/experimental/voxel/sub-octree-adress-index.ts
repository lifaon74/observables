import { ADDRESS_BYTES_PER_ELEMENT } from './memory-address';

/**
 * A subOctreeAddressIndex is the index of the sub octree of a specific octree (so going from in the range [0, 8[)
 */

/**
 * Converts an 3d (x, y, z) position at a specific depth of an octree,
 * into the index of the sub octree's address
 */
export function Convert3DPositionToSubOctreeAddressIndex(
  depth: number,
  x: number,
  y: number,
  z: number,
) {
  return (
    ((x >> depth) & 0x1)
    | (((y >> depth) & 0x1) << 1)
    | (((z >> depth) & 0x1) << 2)
  ) >>> 0;
}

/**
 * Returns true (a number different of 0) if the data at subOctreeAddressIndex is a child octree instead of a material
 */
export function IsSubOctreeAddressIndexAVoxelOctreeAddress(
  memory: Uint8Array,
  address: number,
  subOctreeAddressIndex: number,
): number {
  return (memory[address] >> subOctreeAddressIndex) & 0x1;
}

export function WriteSubOctreeAddressIndexAsSubVoxelOctree(
  memory: Uint8Array,
  address: number,
  subOctreeAddressIndex: number,
): void {
  memory[address] |= (0x1 << subOctreeAddressIndex);
}

export function WriteSubOctreeAddressIndexAsVoxelMaterial(
  memory: Uint8Array,
  address: number,
  subOctreeAddressIndex: number,
): void {
  memory[address] &= ~(0x1 << subOctreeAddressIndex);
}


export function SubOctreeAddressIndexToMemoryAddressOffset(
  subOctreeAddressIndex: number,
): number {
  return 1 + subOctreeAddressIndex * ADDRESS_BYTES_PER_ELEMENT;
}

export function SubOctreeAddressIndexToMemoryAddress(
  address:number,
  subOctreeAddressIndex: number,
): number {
  return address + SubOctreeAddressIndexToMemoryAddressOffset(subOctreeAddressIndex);
}

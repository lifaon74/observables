import { ADDRESS_BYTES_PER_ELEMENT, MemoryView, ReadAddress, TAllocFunction, WriteAddress } from './memory-address';
import { NO_MATERIAL_ADDRESS } from './material';
import { ResolveMappedAddress, ResolveMappedMemory, TMappedMemories, TMappedMemoryAddresses } from './mapped-memory';
import {
  Convert3DPositionToSubOctreeAddressIndex, IsSubOctreeAddressIndexAVoxelOctreeAddress,
  SubOctreeAddressIndexToMemoryAddress,
   WriteSubOctreeAddressIndexAsSubVoxelOctree
} from './sub-octree-adress-index';

export const VOXEL_OCTREE_BYTES_PER_ELEMENT = 1 + ADDRESS_BYTES_PER_ELEMENT * 8;

/**
 * Represents a Voxel Octree: it is used to represent a square shape composed of many voxels in a performing manner
 *  - [is-sub-octree: 0b{#0, #1, #2, ...}, address0 (32b), address1 (32b), ...]
 */
export class VoxelOctree extends MemoryView {
  static BYTES_PER_ELEMENT: number = VOXEL_OCTREE_BYTES_PER_ELEMENT;

  static create(
    memory: Uint8Array,
    alloc: TAllocFunction,
    depth: number,
    materialAddress?: number,
  ): VoxelOctree {
    const voxelOctree = new VoxelOctree(memory, alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT), depth);
    CreateVoxelOctree(voxelOctree.memory, voxelOctree.address, materialAddress);
    return voxelOctree;
  }

  readonly depth: number;

  constructor(
    memory: Uint8Array,
    address: number,
    depth: number,
  ) {
    super(memory, address);
    this.depth = depth;
  }

  get side(): number {
    return GetVoxelOctreeSideFromDepth(this.depth);
  }
}


/*--------------------------*/

/**
 * Returns the depth of a Voxel Octree from knowing its side
 */
export function GetVoxelOctreeDepthFromSide(side: number): number {
  let depth: number = -1;
  while ((side & 0x1) === 0) {
    side >>= 1;
    depth++;
  }

  if (side !== 0x1) {
    throw new Error(`Invalid side ${ side }: must be a power of 2`);
  }

  if (depth < 0) {
    throw new Error(`Invalid side ${ side }: must be greater than 2`);
  }

  return depth;
}

/**
 * Returns the side of a Voxel Octree knowing its depth
 */
export function GetVoxelOctreeSideFromDepth(depth: number): number {
  return 2 << depth;
}



/*--------------------------*/




/**
 * Creates a Voxel Octree into memory
 */
export function CreateVoxelOctree(
  memory: Uint8Array,
  address: number,
  materialAddress: number = NO_MATERIAL_ADDRESS,
): void {
  memory[address++] = 0b00000000;
  for (let i = 0; i < 8; i++) {
    WriteAddress(memory, address, materialAddress);
    address += ADDRESS_BYTES_PER_ELEMENT;
  }
}

/**
 * Fast copy of a Voxel Octree into another memory and address
 */
export function CopyVoxelOctree(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationMemory: Uint8Array,
  destinationAddress: number,
): void {
  for (let i = 0; i < VOXEL_OCTREE_BYTES_PER_ELEMENT; i++) {
    destinationMemory[destinationAddress + i] = sourceMemory[sourceAddress + i];
  }
}


/**
 * Returns the address of the material composing a Voxel Octree at position (x, y, z)
 */
export function ReadVoxelOctreeMaterialAddress(
  memory: Uint8Array,
  address: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): number {
  let subOctreeAddressIndex: number;
  let _address: number; // temp address

  while (depth >= 0) {
    subOctreeAddressIndex = Convert3DPositionToSubOctreeAddressIndex(depth, x, y, z);
    _address = ReadAddress(memory, SubOctreeAddressIndexToMemoryAddress(address, subOctreeAddressIndex));
    if (IsSubOctreeAddressIndexAVoxelOctreeAddress(memory, address, subOctreeAddressIndex)) {
      address = _address;
      depth--;
    } else {
      return _address;
    }
  }

  throw new Error('Invalid coords');
}

/**
 * Writes a new material address (materialAddress) at position (x, y, z) in a Voxel Octree
 *  - creates new child octrees if required
 */
export function WriteVoxelOctreeMaterialAddress(
  memory: Uint8Array,
  address: number,
  alloc: TAllocFunction,
  depth: number,
  x: number,
  y: number,
  z: number,
  materialAddress: number,
): void {
  let subOctreeAddressIndex: number;
  let _subOctreeAddress: number; // temp address of a sub octree's address
  let _address: number; // temp address

  // insert materialAddress at proper place
  while (depth >= 0) {
    subOctreeAddressIndex = Convert3DPositionToSubOctreeAddressIndex(depth, x, y, z);
    _subOctreeAddress = SubOctreeAddressIndexToMemoryAddress(address, subOctreeAddressIndex);

    if (depth === 0) {
      // for depth === 0 mask should be equals to 'material' by default
      // WriteAddressSpotAsVoxelMaterial(memory, address, subOctreeAddressIndex)
      WriteAddress(memory, _subOctreeAddress, materialAddress);
      break;
    } else {
      _address = ReadAddress(memory, _subOctreeAddress);
      if (IsSubOctreeAddressIndexAVoxelOctreeAddress(memory, address, subOctreeAddressIndex)) { // is address type
        address = _address;
      } else {
        if (_address === materialAddress) { // same values
          break; // here we are not at the deepest lvl, material addresses are the same and octree should already be optimized => touch nothing
        } else { // material addresses are different => must split current materialAddress into another octree
          const newAddress: number = alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT); // allocates memory for a new octree
          CreateVoxelOctree(memory, newAddress, _address); // put current material address as octree's materials

          // replace mask value by octree type
          WriteSubOctreeAddressIndexAsSubVoxelOctree(memory, address, subOctreeAddressIndex);

          // replace value by newAddress
          WriteAddress(memory, _subOctreeAddress, newAddress);

          address = newAddress;
        }
      }
    }

    depth--;
  }
}



/*--------------------------*/

export function ReadMappedAddress(
  memory: Uint8Array,
  address: number,
  addressesMap: TMappedMemoryAddresses,
): number {
  return ResolveMappedAddress(ReadAddress(memory, address), addressesMap);
}

export function CopyRemappedAddress(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationMemory: Uint8Array,
  destinationAddress: number,
  addressesMap: TMappedMemoryAddresses,
): void {
  WriteAddress(destinationMemory, destinationAddress, ReadMappedAddress(sourceMemory, sourceAddress, addressesMap));
}

/**
 * Copies a Voxel Octree into another memory and address after applying a new memory mapping
 */
export function CopyRemappedVoxelOctree(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationMemory: Uint8Array,
  destinationAddress: number,
  addressesMap: TMappedMemoryAddresses,
): void {
  destinationMemory[destinationAddress++] = sourceMemory[sourceAddress++];
  for (let i = 0; i < 8; i++) {
    CopyRemappedAddress(sourceMemory, sourceAddress, destinationMemory, destinationAddress, addressesMap);
    sourceAddress += ADDRESS_BYTES_PER_ELEMENT;
    destinationAddress += ADDRESS_BYTES_PER_ELEMENT;
  }
}

/**
 * Returns true if resolved addresses are the same
 */
export function AreSameRemappedAddresses(
  memory1: Uint8Array,
  address1: number,
  memory2: Uint8Array,
  address2: number,
  memoriesMap: TMappedMemories
): boolean {
  const _address1: number = ReadAddress(memory1, address1);
  const _address2: number = ReadAddress(memory2, address2);
  let remappedAddress1: number | undefined;
  let remappedAddress2: number | undefined;

  if (_address1 !== NO_MATERIAL_ADDRESS) {
    if (memoriesMap.has(memory1)) {
      const subMap: TMappedMemoryAddresses = memoriesMap.get(memory1) as TMappedMemoryAddresses;
      if (subMap.has(_address1)) {
        remappedAddress1 = subMap.get(_address1) as number;
      }
    }
  }

  if (_address2 !== NO_MATERIAL_ADDRESS) {
    if (memoriesMap.has(memory2)) {
      const subMap: TMappedMemoryAddresses = memoriesMap.get(memory2) as TMappedMemoryAddresses;
      if (subMap.has(_address2)) {
        remappedAddress2 = subMap.get(_address2) as number;
      }
    }
  }

  if (remappedAddress1 === void 0) { // _address1 has not been remapped
    if (remappedAddress2 === void 0) { // _address2 has not been remapped
      if (_address1 === NO_MATERIAL_ADDRESS) { // _address1 has no material
        return (_address2 === NO_MATERIAL_ADDRESS); // returns true if _address2 has no material too
      } else if (_address2 === NO_MATERIAL_ADDRESS) { // _address1 is normal but _address2 has no material
        return false;
      } else if (memory1 === memory2) { // _address1 and _address2 are normal, ensures than both memory are the same
        return (_address1 === _address2); // returns true if both addresses are the same
      } else { // _address1 and _address2 are valid, but memories are different, so addresses can't compare
        return false;
      }
    } else if (remappedAddress2 === NO_MATERIAL_ADDRESS) { // _address2 has been remapped, and remappedAddress2 has no material
      return (_address1 === NO_MATERIAL_ADDRESS); // returns true if _address1 has no material too
    } else { // address2 has been remapped, and _address1 is a normal address => memories are different, so addresses can't compare
      return false;
    }
  } else if (remappedAddress1 === NO_MATERIAL_ADDRESS) { // _address1 has been remapped, and remappedAddress1 has no material
    if (remappedAddress2 === void 0) { // _address2 has not been remapped
      return (_address2 === NO_MATERIAL_ADDRESS);
    } else { // _address2 has been remapped
      return (remappedAddress2 === NO_MATERIAL_ADDRESS); // returns true if remappedAddress2 has no material too
    }
  } else { // _address1 has been remapped
    if (remappedAddress2 === void 0) { // _address2 has not been remapped => memories are different, so addresses can't compare
      return false;
    } else if (remappedAddress2 === NO_MATERIAL_ADDRESS) {
      return false;
    } else { // both addresses remapped
      return (remappedAddress1 === remappedAddress2);
    }
  }
}

/**
 * Returns true if both octrees are the same after their addresses are resolved
 */
export function AreSameRemappedVoxelOctrees(
  memory1: Uint8Array,
  address1: number,
  memory2: Uint8Array,
  address2: number,
  memoriesMap: TMappedMemories
): boolean {
  if (
    (memory1 === memory2)
    && (address1 === address2)
  ) {
    return true;
  } else {
    if (memory1[address1++] === memory2[address2++]) {
      for (let i = 0; i < 8; i++) {
        if (!AreSameRemappedAddresses(memory1, address1, memory2, address2, memoriesMap)) {
          return false;
        }
        address1 += ADDRESS_BYTES_PER_ELEMENT;
        address2 += ADDRESS_BYTES_PER_ELEMENT;
      }
      return true;
    } else {
      return false;
    }
  }
}




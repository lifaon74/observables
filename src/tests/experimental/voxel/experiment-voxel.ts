// class Texture3D {
//   x: number;
//   y: number;
//   z: number;
//
//   constructor() {
//   }
// }

class MemoryView {
  public memory: Uint8Array;
  public index: number;

  constructor(
    memory: Uint8Array,
    index: number,
  ) {
    this.memory = memory;
    this.index = index;
  }
}

/*---*/

const VOXEL_MATERIAL_BYTES_PER_ELEMENT = 5;

/**
 * Creates a Voxel Material into memory
 *  - [r, g, b, a, reflection]
 */
function CreateVoxelMaterial(
  memory: Uint8Array,
  index: number,
  r: number,
  g: number,
  b: number,
  a: number,
  reflection: number,
): void {
  memory[index] = r;
  memory[index + 1] = g;
  memory[index + 2] = b;
  memory[index + 3] = a;
  memory[index + 4] = reflection;
}

function AreSameMaterials(
  memory1: Uint8Array,
  index1: number,
  memory2: Uint8Array,
  index2: number,
): boolean {
  for (let i = 0; i < VOXEL_MATERIAL_BYTES_PER_ELEMENT; i++) {
    if (memory1[index1 + i] !== memory2[index2 + i]) {
      return false;
    }
  }
  return true;
}

function CopyMaterial(
  sourceMemory: Uint8Array,
  sourceIndex: number,
  destinationMemory: Uint8Array,
  destinationIndex: number,
): void {
  for (let i = 0; i < VOXEL_MATERIAL_BYTES_PER_ELEMENT; i++) {
    destinationMemory[destinationIndex + i] = sourceMemory[sourceIndex + i];
  }
}

class VoxelMaterial extends MemoryView {
  static BYTES_PER_ELEMENT: number = VOXEL_MATERIAL_BYTES_PER_ELEMENT;

  constructor(
    memory: Uint8Array,
    index: number,
  ) {
    super(memory, index);
  }
}

/*---*/

/**
 * Returns the depth of a Voxel Octree from a 'side'
 */
function GetVoxelOctreeDepthFromSide(side: number): number {
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

function GetVoxelOctreeSideFromDepth(depth: number): number {
  return 2 << depth;
}



const ADDRESS_BYTES_PER_ELEMENT = 4;

/**
 * Writes an address into the memory
 */
function WriteAddress(
  memory: Uint8Array,
  index: number,
  address: number
): void {
  // INFO all same perf
  // memory[index    ] = address & 0xff;
  // memory[index + 1] = (address >>> 8) & 0xff;
  // memory[index + 2] = (address >>> 16) & 0xff;
  // memory[index + 3] = (address >>> 24) & 0xff;
  memory[index] = address;
  memory[index + 1] = (address >>> 8);
  memory[index + 2] = (address >>> 16);
  memory[index + 3] = (address >>> 24);
  // memory[index++] = address;
  // memory[index++] = (address >> 8);
  // memory[index++] = (address >> 16);
  // memory[index++] = (address >> 24);
}

/**
 * Reads an address from the memory
 */
function ReadAddress(
  memory: Uint8Array,
  index: number,
): number {
  return (
    (memory[index])
    | (memory[index + 1] << 8)
    | (memory[index + 2] << 16)
    | (memory[index + 3] << 24)
  ) >>> 0;
}

/**
 * Returns true if both addresses are equals
 */
function AreSameAddresses(
  memory: Uint8Array,
  index1: number,
  index2: number,
): boolean {
  return (
    (memory[index1] === memory[index2])
    && (memory[index1 + 1] === memory[index2 + 1])
    && (memory[index1 + 2] === memory[index2 + 2])
    && (memory[index1 + 3] === memory[index2 + 3])
  );
}


interface TMemoryAndIndex {
  memory: Uint8Array;
  index: number;
}
type TMappedMemoryIndexesToMemories = Map<number, TMemoryAndIndex>;
type TMappedMemories = Map<Uint8Array, TMappedMemoryIndexesToMemories>;

function CreateMappedMemories(): TMappedMemories {
  return new Map<Uint8Array, TMappedMemoryIndexesToMemories>();
}

function MapMemory(
  sourceMemory: Uint8Array,
  sourceIndex: number,
  destinationMemory: Uint8Array,
  destinationIndex: number,
  memoriesMap: TMappedMemories
): TMappedMemories  {
  let subMap: TMappedMemoryIndexesToMemories;
  if (memoriesMap.has(sourceMemory)) {
    subMap = memoriesMap.get(sourceMemory) as TMappedMemoryIndexesToMemories;
  } else {
    subMap = new Map<number, TMemoryAndIndex>();
    memoriesMap.set(sourceMemory, subMap);
  }

  if (subMap.has(sourceIndex)) {
    console.warn('remap', sourceMemory, sourceIndex, destinationMemory, destinationIndex);
    const mapped: TMemoryAndIndex = subMap.get(sourceIndex) as TMemoryAndIndex;
    mapped.memory = destinationMemory;
    mapped.index = destinationIndex;
  } else {
    const mapped: TMemoryAndIndex = {
      memory: destinationMemory,
      index: destinationIndex,
    };
    subMap.set(sourceIndex, mapped);
  }

  return memoriesMap;
}

function ResolveMappedMemory(
  memory: Uint8Array,
  index: number,
  memoriesMap: TMappedMemories
): TMemoryAndIndex {
  if (memoriesMap.has(memory)) {
    const subMap: TMappedMemoryIndexesToMemories = memoriesMap.get(memory) as TMappedMemoryIndexesToMemories;
    if (subMap.has(index)) {
      const result: TMemoryAndIndex = subMap.get(index) as TMemoryAndIndex;
      return ResolveMappedMemory(result.memory, result.index, memoriesMap);
    }
  }

  return {
    memory,
    index,
  };
}


type TAllocFunction = (size: number) => number;



const VOXEL_OCTREE_BYTES_PER_ELEMENT = 1 + ADDRESS_BYTES_PER_ELEMENT * 8;

/**
 * Converts an x, y, z position at a specific depth, into the spot number of the address into the octree addresses bytes
 */
function ConvertPositionToOctreeAddressSpot(
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

function IsAddressSpotSubVoxelOctree(
  memory: Uint8Array,
  index: number,
  addressSpot: number,
): number {
  return (memory[index] >> addressSpot) & 0x1;
}

function WriteAddressSpotAsSubVoxelOctree(
  memory: Uint8Array,
  index: number,
  addressSpot: number,
): void {
  memory[index] |= (0x1 << addressSpot);
}

function WriteAddressSpotAsVoxelMaterial(
  memory: Uint8Array,
  index: number,
  addressSpot: number,
): void {
  memory[index] &= ~(0x1 << addressSpot);
}



function AddressSpotToIndex(
  addressSpot: number,
): number {
  return 1 + addressSpot * ADDRESS_BYTES_PER_ELEMENT;
}




/**
 * Creates a Voxel Octree into memory
 *  - [is-sub-octree: 0b{#0, #1, #2, ...}, address0 (32b), address1 (32b), ...]
 */
function CreateVoxelOctree(
  memory: Uint8Array,
  index: number,
  materialIndex: number = 0,
): void {
  memory[index++] = 0b00000000;
  for (let i = 0; i < 8; i++) {
    WriteAddress(memory, index, materialIndex);
    index += ADDRESS_BYTES_PER_ELEMENT;
  }
}



function ReadVoxelOctreeMaterialAddress(
  memory: Uint8Array,
  index: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): number {
  let addressSpot: number;
  let _index: number; // temp sub index

  while (depth >= 0) {
    addressSpot = ConvertPositionToOctreeAddressSpot(depth, x, y, z);
    _index = index + AddressSpotToIndex(addressSpot);

    if (IsAddressSpotSubVoxelOctree(memory, index, addressSpot)) {
      index = ReadAddress(memory, _index);
      depth--;
    } else {
      return _index;
    }
  }

  throw new Error('Invalid coords');
}

function WriteVoxelOctreeMaterialAddress(
  memory: Uint8Array,
  index: number,
  alloc: TAllocFunction,
  depth: number,
  x: number,
  y: number,
  z: number,
  materialIndex: number,
): void {
  let addressSpot: number;
  let _index: number;

  // insert materialAddress at proper place
  while (depth >= 0) {
    addressSpot = ConvertPositionToOctreeAddressSpot(depth, x, y, z);
    _index = index + AddressSpotToIndex(addressSpot);

    if (depth === 0) {
      // for depth === 0 mask should be equals to 'material' by default
      // WriteAddressSpotAsVoxelMaterial(memory, index, addressSpot)
      WriteAddress(memory, _index, materialIndex);
      break;
    } else {
      if (IsAddressSpotSubVoxelOctree(memory, index, addressSpot)) { // is address type
        index = ReadAddress(memory, _index);
      } else {
        if (ReadAddress(memory, _index) === materialIndex) { // same values
          break; // here we are not at the deepest lvl, material addresses are the same and octree should already be optimized => touch nothing
        } else { // material addresses are different => must split current materialAddress into another octree
          const newIndex: number = alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT); // allocates memory for a new octree
          CreateVoxelOctree(memory, newIndex, ReadAddress(memory, _index)); // put current material address as octree's materials

          // replace mask value by octree type
          WriteAddressSpotAsSubVoxelOctree(memory, index, addressSpot);

          // replace value by newIndex
          WriteAddress(memory, _index, newIndex);

          index = newIndex;
        }
      }
    }

    depth--;
  }
}


class VoxelOctree extends MemoryView {
  static BYTES_PER_ELEMENT: number = VOXEL_OCTREE_BYTES_PER_ELEMENT;

  depth: number;

  constructor(
    memory: Uint8Array,
    index: number,
    depth: number,
  ) {
    super(memory, index);
    this.depth = depth;
  }
}

/*--------------------------*/

/**
 * Returns the list a material addresses, used by a VoxelOctree
 */
function ListVoxelOctreeMaterialAddresses(
  memory: Uint8Array,
  index: number,
  materials: Set<number> = new Set<number>()
): Set<number> {
  let _index: number = index + 1;
  let address: number;
  for (let i = 0; i < 8; i++) { // for each sub-tree
    address = ReadAddress(memory, _index);
    if (IsAddressSpotSubVoxelOctree(memory, index, i)) {
      ListVoxelOctreeMaterialAddresses(memory, address, materials);
    } else {
      materials.add(address);
    }
    _index += ADDRESS_BYTES_PER_ELEMENT;
  }
  return materials;
}


/**
 * Reduces the complexity of an Octree by merging common Materials
 */
function CompactMaterialsByRemovingDuplicates(
  memory: Uint8Array,
  alloc: TAllocFunction,
  materials: VoxelMaterial[], // assumes memory and index already resolved
  memoriesMap: TMappedMemories = CreateMappedMemories()
): TMappedMemories {
  const materialsLength: number = materials.length;
  const available: boolean[] = new Array(materialsLength).fill(true);
  for (let i = 0, l = materialsLength - 1; i < l; i++) {
    if (available[i]) {
      const material1: VoxelMaterial = materials[i];
      const newIndex: number = alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
      CopyMaterial(material1.memory, material1.index, memory, newIndex);
      MapMemory(material1.memory, material1.index, memory, newIndex, memoriesMap);

      for (let j = i + 1; j < materialsLength; j++) {
        if (available[j]) {
          const material2: VoxelMaterial = materials[j];
          if (AreSameMaterials(material1.memory, material1.index, material2.memory, material2.index)) {
            MapMemory(material2.memory, material2.index, memory, newIndex, memoriesMap);
            available[j] = false;
          }
        }
      }
    }
  }
  return memoriesMap;
}

function CompactMaterialsFromVoxelOctrees(
  memory: Uint8Array,
  alloc: TAllocFunction,
  octrees: VoxelOctree[],
): TMappedMemories {
  // list all used materials
  const usedMaterials: VoxelMaterial[] = [];
  for (let i = 0, l = octrees.length; i < l; i++) {
    const octree: VoxelOctree = octrees[i];
    const iterator: Iterator<number> = ListVoxelOctreeMaterialAddresses(octree.memory, octree.index)[Symbol.iterator]();
    let result: IteratorResult<number>;
    while (!(result = iterator.next()).done) {
      usedMaterials.push(new VoxelMaterial(octree.memory, result.value));
    }
  }

  // compact materials into the new memory by removing redundant ones
  return CompactMaterialsByRemovingDuplicates(memory, alloc, usedMaterials);
}


/**
 * Reduces the complexity of an Octree by merging common Materials
 */
function CompactVoxelOctreeByGroupingMaterials(
  memory: Uint8Array,
  index: number,
): number | null {

  let _index: number = index + 1;
  // the common address
  // undefined => not computed
  // null => no common addresses
  // number => common address
  let address: number | null | undefined = void 0;
  let subAddress: number | null;

  for (let i = 0; i < 8; i++) {
    subAddress = ReadAddress(memory, _index);
    if (IsAddressSpotSubVoxelOctree(memory, index, i)) {
      subAddress = CompactVoxelOctreeByGroupingMaterials(memory, subAddress);

      if (subAddress === null) {
        address = null;
      } else { // here the sub-octree returned a value so it can be merged
        WriteAddressSpotAsVoxelMaterial(memory, index, i);
        WriteAddress(memory, _index, subAddress);
        // at this point we don't know if octree is used somewhere else
      }
    }

    if (address === void 0) {
      address = subAddress;
    } else if ((address !== null) && (subAddress !== address)) {
      address = null;
    }

    _index += ADDRESS_BYTES_PER_ELEMENT;
  }

  return address as (number | null);
}

function CompactVoxelOctreesByGroupingMaterials(
  octrees: VoxelOctree[]
): void {
  for (let i = 0, l = octrees.length; i < l; i++) {
    const octree: VoxelOctree = octrees[i];
    CompactVoxelOctreeByGroupingMaterials(octree.memory, octree.index);
  }
}

function CompactVoxelOctrees(
  memory: Uint8Array,
  alloc: TAllocFunction,
  octrees: VoxelOctree[],
): void {
  // compact octrees by grouping their materials
  CompactVoxelOctreesByGroupingMaterials(octrees);

  // compact materials into the new memory by removing duplicates and non used
  const memoriesMap: TMappedMemories = CompactMaterialsFromVoxelOctrees(memory, alloc, octrees);

  // TODO continue here => finish compact

}

/*--------------------------*/

function AllocBiggestBuffer(): ArrayBuffer {
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

/*--------------------------*/

/** DRAW **/

type TDrawCallbackWithMaterial = (
  x: number,
  y: number,
  z: number,
  materialIndex: number,
) => void;

type TDrawCallback = (
  x: number,
  y: number,
  z: number,
) => void;

function ClampDraw(
  draw: TDrawCallback,
  x_min: number,
  y_min: number,
  z_min: number,
  x_max: number,
  y_max: number,
  z_max: number,
): TDrawCallback {
  return (
    x: number,
    y: number,
    z: number,
  ) => {
    if (
      ((x_min <= x) && (x < x_max))
      && ((y_min <= y) && (y < y_max))
      && ((z_min <= z) && (z < z_max))
    ) {
      draw(x, y, z);
    }
  };
}

function ClampDrawForOctree(
  draw: TDrawCallback,
  depth: number,
): TDrawCallbackWithMaterial {
  const side: number = GetVoxelOctreeSideFromDepth(depth);
  return ClampDraw(draw, 0, 0, 0, side, side, side);
}


function TranslateDraw(
  draw: TDrawCallback,
  x: number,
  y: number,
  z: number,
): TDrawCallbackWithMaterial {
  return (
    _x: number,
    _y: number,
    _z: number,
  ) => {
    draw(x + _x, y + _y, z + _z);
  };
}

function DrawRectangle(
  draw: TDrawCallback,
  x_size: number,
  y_size: number,
  z_size: number,
): void {
  for (let x = 0; x < x_size; x++) {
    for (let y = 0; y < y_size; y++) {
      for (let z = 0; z < z_size; z++) {
        draw(x, y, z);
      }
    }
  }
}

function DrawSquare(
  draw: TDrawCallback,
  side: number,
): void {
  DrawRectangle(draw, side, side, side);
}


function drawUniformRedSquareForOctree(
  memory: Uint8Array,
  index: number,
  depth: number,
  alloc: TAllocFunction,
) {
  const side: number = GetVoxelOctreeSideFromDepth(depth);
  const materialIndex = alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
  CreateVoxelMaterial(memory, materialIndex, 255, 0, 0, 255, 0);

  DrawSquare(
    ClampDraw((
      x: number,
      y: number,
      z: number,
      ) => {
        WriteVoxelOctreeMaterialAddress(
          memory,
          index,
          alloc,
          depth,
          x,
          y,
          z,
          materialIndex,
        );
      },
      0, 0, 0, side, side, side
    ),
    side
  );
}

function drawRandomSquareForOctree(
  memory: Uint8Array,
  index: number,
  depth: number,
  alloc: TAllocFunction,
  materials: number[]
) {
  const side: number = GetVoxelOctreeSideFromDepth(depth);

  DrawSquare(
    ClampDraw((
      x: number,
      y: number,
      z: number,
      ) => {
        WriteVoxelOctreeMaterialAddress(
          memory,
          index,
          alloc,
          depth,
          x,
          y,
          z,
          materials[Math.floor(Math.random() * materials.length)],
        );
      },
      0, 0, 0, side, side, side
    ),
    side
  );
}

/*--------------------------*/

function speedTest(): void {
  const MEMORY = new Uint8Array((2 ** 31) - 1);
  console.time('speed');
  for (let i = 0; i < 1e8; i++) {
    WriteAddress(MEMORY, i, 123456789);
  }
  console.timeEnd('speed');

  let j = 0;
  for (let i = 0; i < 1e8; i++) {
    j += ReadAddress(MEMORY, i);
  }
  console.log('j', j);
}

class AbstractMemory {
  public readonly buffer: ArrayBuffer;

  private writeIndex: number;

  constructor(sizeOfBuffer: number /* size */ | ArrayBuffer /* buffer */) {
    this.buffer = (typeof sizeOfBuffer === 'number')
      ? new ArrayBuffer(sizeOfBuffer)
      : sizeOfBuffer;
    this.writeIndex = 0;
  }

  alloc(size: number): number {
    const index: number = this.writeIndex;
    this.writeIndex += size;
    return index;
  }

  reset(): void {
    this.writeIndex = 0;
  }
}

function experimentalVoxel1() {
  const MEMORY = new AbstractMemory((2 ** 31) - 1);
  const MEMORY_VIEW = new Uint8Array(MEMORY.buffer);


  const materials: VoxelMaterial[] = [];
  const voxels: VoxelOctree[] = [];
  let index: number;

  index = MEMORY.alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
  CreateVoxelMaterial(MEMORY_VIEW, index, 255, 0, 0, 255, 0);
  materials.push(new VoxelMaterial(MEMORY_VIEW, index));

  index = MEMORY.alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
  CreateVoxelMaterial(MEMORY_VIEW, index, 0, 255, 0, 255, 0);
  materials.push(new VoxelMaterial(MEMORY_VIEW, index));

  index = MEMORY.alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT);
  CreateVoxelOctree(MEMORY_VIEW, index, 0);
  voxels.push(new VoxelOctree(MEMORY_VIEW, index, GetVoxelOctreeDepthFromSide(2)));

  // console.log(ReadVoxelOctreeMaterialAddress());

  console.log(MEMORY_VIEW);
}


function experimentalVoxel2() {
  const MEMORY = new AbstractMemory(2 ** 16);
  const MEMORY_VIEW = new Uint8Array(MEMORY.buffer);
  const alloc = MEMORY.alloc.bind(MEMORY);

  const materials: number[] = Array.from({ length : 256 }, () => {
    const index = MEMORY.alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
    CreateVoxelMaterial(MEMORY_VIEW, index, Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 255, 0);
    return index;
  });

  const index = MEMORY.alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT);
  const voxelDepth: number = GetVoxelOctreeDepthFromSide(4);
  CreateVoxelOctree(MEMORY_VIEW, index, 0);
  // drawUniformRedSquareForOctree(MEMORY_VIEW, index, voxelDepth, alloc);
  drawRandomSquareForOctree(MEMORY_VIEW, index, voxelDepth, alloc, materials.slice(0, 16));

  console.log(ListVoxelOctreeMaterialAddresses(MEMORY_VIEW, index));
  console.log(MEMORY_VIEW);
}

function experimentalVoxel3() {
  const MEMORY = new AbstractMemory(2 ** 16);
  const MEMORY_VIEW = new Uint8Array(MEMORY.buffer);
  const alloc = MEMORY.alloc.bind(MEMORY);

  const materials: number[] = Array.from({ length : 4 }, () => {
    const index = MEMORY.alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
    // CreateVoxelMaterial(MEMORY_VIEW, index, Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 255, 0);
    CreateVoxelMaterial(MEMORY_VIEW, index, 255, 0, 0, 255, 0);
    return index;
  });

  const index = MEMORY.alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT);
  const voxelDepth: number = GetVoxelOctreeDepthFromSide(4);
  CreateVoxelOctree(MEMORY_VIEW, index, 0);
  drawRandomSquareForOctree(MEMORY_VIEW, index, voxelDepth, alloc, materials.slice(0, 16));

  const COMPACTED_MEMORY = new AbstractMemory(2 ** 16);
  const COMPACTED_MEMORY_VIEW = new Uint8Array(COMPACTED_MEMORY.buffer);
  const compactedAlloc = COMPACTED_MEMORY.alloc.bind(MEMORY);
  const compacted = CompactMaterialsByRemovingDuplicates(COMPACTED_MEMORY_VIEW, compactedAlloc, materials.map(material => new MemoryView(MEMORY_VIEW, material)));
  console.log(compacted);
}

/*--------------------------*/

export function debugVoxel(): void {
  // experimentalVoxel1();
  // experimentalVoxel2();
  experimentalVoxel3();
}

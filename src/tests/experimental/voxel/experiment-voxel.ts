import { ReadAddress, WriteAddress } from './memory-address';
import { AbstractMemory } from './abstract-memory';
import { CreateVoxelMaterial, VOXEL_MATERIAL_BYTES_PER_ELEMENT, VoxelMaterial } from './material';
import { CreateVoxelOctree, GetVoxelOctreeDepthFromSide, VOXEL_OCTREE_BYTES_PER_ELEMENT, VoxelOctree } from './octree';
import {
  drawImageData, drawRainbowSquareForOctree, drawRandomSquareForOctree, drawUniformRedSquareForOctree, sliceOctree
} from './draw';
import { CompactVoxelOctrees, ListVoxelOctreeMaterialAddresses } from './compact';
// class Texture3D {
//   x: number;
//   y: number;
//   z: number;
//
//   constructor() {
//   }
// }

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

  const materials: number[] = Array.from({ length: 256 }, () => {
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
  const MEMORY_VIEW = MEMORY.toUint8Array();
  const alloc = MEMORY.toAllocFunction();
  const materialsLength: number = 2;

  const materials: VoxelMaterial[] = Array.from({ length: materialsLength }, (v: any, i: number) => {
    const index = MEMORY.alloc(VOXEL_MATERIAL_BYTES_PER_ELEMENT);
    // CreateVoxelMaterial(MEMORY_VIEW, index, Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 255, 0);
    const c: number = Math.floor(i * (255 / (materialsLength - 1)));
    CreateVoxelMaterial(MEMORY_VIEW, index, c, c, c, 255, 0);
    // CreateVoxelMaterial(MEMORY_VIEW, index, 255, 0, 0, 255, 0);
    return new VoxelMaterial(MEMORY_VIEW, index);
  });

  const voxels: VoxelOctree[] = Array.from({ length: 1 }, () => {
    const index = MEMORY.alloc(VOXEL_OCTREE_BYTES_PER_ELEMENT);
    const voxelDepth: number = GetVoxelOctreeDepthFromSide(2);
    CreateVoxelOctree(MEMORY_VIEW, index);
    drawRandomSquareForOctree(MEMORY_VIEW, index, voxelDepth, alloc, materials.map(_ => _.address));
    // drawUniformSphereForOctree(MEMORY_VIEW, index, voxelDepth, alloc, materials[0].index);
    return new VoxelOctree(MEMORY_VIEW, index, voxelDepth);
  });
  // TODO continue here => fix slicing => draw, read, or write problem

  MEMORY.log('memory');
  console.log(voxels);

  const octree = voxels[0];
  // console.log(ReadVoxelOctreeMaterialAddress(octree.memory, octree.index, octree.depth, 0, 0, 8));
  drawImageData(sliceOctree(octree, octree.side / 2));

  const COMPACTED_MEMORY = new AbstractMemory(2 ** 16);
  const COMPACTED_MEMORY_VIEW = COMPACTED_MEMORY.toUint8Array();
  const compactedAlloc = COMPACTED_MEMORY.toAllocFunction();
  const compactedVoxels = CompactVoxelOctrees(COMPACTED_MEMORY_VIEW, compactedAlloc, voxels, { originalSize: MEMORY.bytesUsed });

  COMPACTED_MEMORY.log('compacted memory');
  console.log(compactedVoxels);
  drawImageData(sliceOctree(compactedVoxels[0], octree.side / 2));
}

function experimentalVoxel4() {
  const MEMORY = new AbstractMemory(2 ** 16);
  const MEMORY_VIEW = MEMORY.toUint8Array();
  const alloc = MEMORY.toAllocFunction();

  const voxelDepth: number = GetVoxelOctreeDepthFromSide(4);
  const voxel = VoxelOctree.create(MEMORY_VIEW, alloc, voxelDepth);
  // drawRainbowSquareForOctree(voxel.memory, voxel.address, voxel.depth, alloc);
  drawUniformRedSquareForOctree(voxel.memory, voxel.address, voxel.depth, alloc);

  MEMORY.log('memory');
  console.log('voxel', voxel);

  drawImageData(sliceOctree(voxel, 0));

  /* --- */
  //
  // const COMPACTED_MEMORY = new AbstractMemory(2 ** 16);
  // const COMPACTED_MEMORY_VIEW = COMPACTED_MEMORY.toUint8Array();
  // const compactedAlloc = COMPACTED_MEMORY.toAllocFunction();
  // console.warn('----------------');
  // const compactedVoxels = CompactVoxelOctrees(COMPACTED_MEMORY_VIEW, compactedAlloc, [voxel], { originalSize: MEMORY.bytesUsed });
  // console.warn('----------------');
  //
  // COMPACTED_MEMORY.log('compacted memory');
  // console.log('compactedVoxels', compactedVoxels[0]);
  // drawImageData(sliceOctree(compactedVoxels[0], 0));

}

/*--------------------------*/

export function debugVoxel(): void {
  // experimentalVoxel1();
  // experimentalVoxel2();
  // experimentalVoxel3();
  experimentalVoxel4();
}

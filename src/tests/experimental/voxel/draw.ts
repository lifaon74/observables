import {
  GetVoxelOctreeSideFromDepth, ReadVoxelOctreeMaterialAddress, VoxelOctree, WriteVoxelOctreeMaterialAddress
} from './octree';
import { CreateVoxelMaterial, NO_MATERIAL_ADDRESS, VOXEL_MATERIAL_BYTES_PER_ELEMENT, VoxelMaterial } from './material';
import { TAllocFunction } from './memory-address';

export type TDrawCallbackWithMaterial = (
  x: number,
  y: number,
  z: number,
  materialIndex: number,
) => void;

export type TDrawCallback = (
  x: number,
  y: number,
  z: number,
) => void;

export function ClampDraw(
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

export function ClampDrawForOctree(
  draw: TDrawCallback,
  depth: number,
): TDrawCallback {
  const side: number = GetVoxelOctreeSideFromDepth(depth);
  return ClampDraw(draw, 0, 0, 0, side, side, side);
}


export function TranslateDraw(
  draw: TDrawCallback,
  x: number,
  y: number,
  z: number,
): TDrawCallback {
  return (
    _x: number,
    _y: number,
    _z: number,
  ) => {
    draw(x + _x, y + _y, z + _z);
  };
}

export function DrawSphere(
  draw: TDrawCallback,
  radius: number,
): void {
  const offset: number = -0.5;

  for (let x = -radius + offset; x <= radius - offset; x++) {
    for (let y = -radius + offset; y <= radius- offset; y++) {
      for (let z = -radius + offset; z <= radius- offset; z++) {

        const d: number = Math.sqrt(
          Math.pow(x, 2)
          + Math.pow(y, 2)
          + Math.pow(z, 2)
        );

        if (d <= radius) {
          draw(x + offset, y + offset, z + offset);
        }
      }
    }
  }
}

export function DrawRectangle(
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

export function DrawSquare(
  draw: TDrawCallback,
  side: number,
): void {
  DrawRectangle(draw, side, side, side);
}


/*---------------------------*/

export function drawUniformRedSquareForOctree(
  memory: Uint8Array,
  address: number,
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
          address,
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

export function drawUniformSphereForOctree(
  memory: Uint8Array,
  address: number,
  depth: number,
  alloc: TAllocFunction,
  materialIndex: number,
) {
  const side: number = GetVoxelOctreeSideFromDepth(depth);
  const radius: number = Math.floor(side / 2);

  const draw = (
    x: number,
    y: number,
    z: number,
  ) => {
    // console.log('write at', x, y, z);
    WriteVoxelOctreeMaterialAddress(
      memory,
      address,
      alloc,
      depth,
      x,
      y,
      z,
      materialIndex,
    );
  };

  DrawSphere(
    TranslateDraw(
      ClampDraw(
        draw,
        0, 0, 0, side, side, side
      ),
      radius, radius, radius
    ),
    radius
  );
}

export function drawRandomSquareForOctree(
  memory: Uint8Array,
  address: number,
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
          address,
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


export function drawRainbowSquareForOctree(
  memory: Uint8Array,
  address: number,
  depth: number,
  alloc: TAllocFunction,
) {
  const side: number = GetVoxelOctreeSideFromDepth(depth);

  DrawSquare(
    ClampDraw((
      x: number,
      y: number,
      z: number,
      ) => {
        const material = VoxelMaterial.create(
          memory,
          alloc,
          Math.floor(x / (side - 1) * 255),
          Math.floor(y / (side - 1) * 255),
          Math.floor(z / (side - 1) * 255),
          255,
          0
        );

        WriteVoxelOctreeMaterialAddress(
          memory,
          address,
          alloc,
          depth,
          x,
          y,
          z,
          material.address,
        );
      },
      0, 0, 0, side, side, side
    ),
    side
  );
}

/*---------------------------*/

export function sliceOctree(
  octree: VoxelOctree,
  z: number,
  cb: (x: number, y: number) => number = (x: number, y: number) => ReadVoxelOctreeMaterialAddress(octree.memory, octree.address, octree.depth, x, y, z),
): ImageData {
  const side = GetVoxelOctreeSideFromDepth(octree.depth);
  const img = new ImageData(side, side);

  let i = 0;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const materialId: number = cb(x, y);
      if (materialId === NO_MATERIAL_ADDRESS) {
        i += 4;
      } else {
        img.data[i++] = octree.memory[materialId];
        img.data[i++] = octree.memory[materialId + 1];
        img.data[i++] = octree.memory[materialId + 2];
        img.data[i++] = octree.memory[materialId + 3];
      }
    }
  }

  return img;
}

export function drawImageData(img: ImageData): void {
  const ctx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  ctx.canvas.width = img.width;
  ctx.canvas.height = img.height;
  ctx.putImageData(img, 0, 0);
  document.body.appendChild(ctx.canvas);

  ctx.canvas.style.width = '512px';
  ctx.canvas.style.height = '512px';
  ctx.canvas.style.imageRendering = 'pixelated';
  ctx.canvas.style.border = '2px solid black';
}

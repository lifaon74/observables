import { NO_MATERIAL_ADDRESS } from './material';

/**
 * Provides some helpers to map a pointer to another.
 *  - useful when the address changes, or a new memory is used
 */


// map from a memory address to another
export type TMappedMemoryAddresses = Map<number, number>;

// map from a memory to a TMappedMemoryAddresses
export type TMappedMemories = Map<Uint8Array, TMappedMemoryAddresses>;


export function CreateMappedMemoryAddresses(): TMappedMemoryAddresses {
  return new Map<number, number>();
}

export function CreateMappedMemories(): TMappedMemories {
  return new Map<Uint8Array, TMappedMemoryAddresses>();
}

export function GetOrCreateMappedMemoryAddressesFromMappedMemories(
  memory: Uint8Array,
  memoriesMap: TMappedMemories,
): TMappedMemoryAddresses {
  if (memoriesMap.has(memory)) {
    return memoriesMap.get(memory) as TMappedMemoryAddresses;
  } else {
    const subMap: TMappedMemoryAddresses = CreateMappedMemoryAddresses();
    memoriesMap.set(memory, subMap);
    return subMap;
  }
}


/**
 * Map [sourceMemory, sourceAddress] to a known memory at 'destinationAddress', and stores it in 'memoriesMap'
 */
export function MapMemory(
  sourceMemory: Uint8Array,
  sourceAddress: number,
  destinationAddress: number,
  memoriesMap: TMappedMemories,
  warn: boolean = true
): TMappedMemories  {
  const subMap: TMappedMemoryAddresses = GetOrCreateMappedMemoryAddressesFromMappedMemories(sourceMemory, memoriesMap);

  if (warn && subMap.has(sourceAddress)) {
    console.warn('remap', sourceMemory, sourceAddress, destinationAddress);
  }

  subMap.set(sourceAddress, destinationAddress);

  return memoriesMap;
}

/**
 * Returns the proper address, after resolving its mapping
 */
export function ResolveMappedAddress(
  address: number,
  addressesMap: TMappedMemoryAddresses
): number {
  return addressesMap.has(address)
    ? addressesMap.get(address) as number
    : address;
}

/**
 * Returns the proper address, after resolving its mapping
 */
export function ResolveMappedMemory(
  memory: Uint8Array,
  address: number,
  memoriesMap: TMappedMemories
): number {
  return (
    (address !== NO_MATERIAL_ADDRESS)
    && memoriesMap.has(memory)
  )
    ? ResolveMappedAddress(address, memoriesMap.get(memory) as TMappedMemoryAddresses)
    : address;
}



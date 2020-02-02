
export interface IDeepMap<T> {
  readonly size: number;
  readonly empty: boolean;

  set(keys: any[], value: T): this;
  get(keys: any[]): T | undefined;
  has(keys: any[]): boolean;
  delete(keys: any[]): boolean;

  entries(): IterableIterator<[any[], T]>;
  keys(): IterableIterator<any[]>;
  values(): IterableIterator<T>;
  [Symbol.iterator](): IterableIterator<[any[], T]>;
  forEach(callback: (entry: T, key: any[], map: this) => void): void;
}


export const DEEP_MAP_PRIVATE = Symbol('deep-map-private');

export interface IDeepMapPrivate<T> {
  map: Map<any, any>;
}

export interface IDeepMapInternal<T> extends IDeepMap<T> {
  [DEEP_MAP_PRIVATE]: IDeepMapPrivate<T>;
}

export function ConstructDeepMap<T>(map: IDeepMap<T>): void {
  Object.defineProperty(map, DEEP_MAP_PRIVATE, {
    value: {},
    configurable: false,
    writable: false,
    enumerable: false,
  });

  (map as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map = new Map<any, any>();
}


export function DeepMapSize(map: Map<any, any>): number {
  const iterator: IterableIterator<any> = map.values();
  let entry: IteratorResult<any>;
  let size: number = 0;

  while (!(entry = iterator.next()).done) {
    if (entry.value instanceof Map) {
      size += DeepMapSize(entry.value);
    } else {
      size++;
    }
  }

  return size;
}

export function DeepMapIsEmpty(map: Map<any, any>): boolean {
  const iterator: IterableIterator<any> = map.values();
  let entry: IteratorResult<any>;

  while (!(entry = iterator.next()).done) {
    if (entry.value instanceof Map) {
      if (!DeepMapIsEmpty(entry.value)) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}


export function DeepMapSet<T>(map: Map<any, any>, keys: any[], value: T): void {
  let entry: any, _entry: any;
  let i: number = 0;
  let key: any;
  const length: number = keys.length;
  const lengthMinusOne: number = length - 1;

  while (true) {
    key = (i < length) ? keys[i] : void 0;
    if (map.has(key)) {
      entry = map.get(key);
      if (entry instanceof Map) {
        map = entry;
      } else {
        if (i < lengthMinusOne) {
          _entry = new Map();
          _entry.set(void 0, entry);
          map.set(key, _entry);
          map = _entry;
        } else {
          map.set(key, value);
          break;
        }
      }
    } else {
      if (i < lengthMinusOne) {
        _entry = new Map();
        map.set(key, _entry);
        map = _entry;
      } else {
        map.set(key, value);
        break;
      }
    }
    i++;
  }
}

export function DeepMapGet<T>(map: Map<any, any>, keys: any[]): T | undefined {
  let entry: any;
  let i: number = 0;
  let arg: any;
  const length: number = keys.length;

  while (true) {
    arg = (i < length) ? keys[i] : void 0;
    if (map.has(arg)) {
      entry = map.get(arg);
      if (entry instanceof Map) {
        map = entry;
        i++;
      } else {
        return (i < (length - 1))
          ? void 0
          : entry;
      }
    } else {
      return void 0;
    }
  }
}

export function DeepMapHas(map: Map<any, any>, keys: any[]): boolean {
  let entry: any;
  let i: number = 0;
  let arg: any;
  const length: number = keys.length;

  while (true) {
    arg = (i < length) ? keys[i] : void 0;
    if (map.has(arg)) {
      entry = map.get(arg);
      if (entry instanceof Map) {
        map = entry;
        i++;
      } else {
        return (i >= (length - 1));
      }
    } else {
      return false;
    }
  }
}

export function DeepMapDelete(map: Map<any, any>, keys: any[]): boolean {
  let entry: any;
  let i: number = 0;
  let arg: any;
  const length: number = keys.length;

  while (true) {
    arg = (i < length) ? keys[i] : void 0;
    if (map.has(arg)) {
      entry = map.get(arg);
      if (entry instanceof Map) {
        map = entry;
        i++;
      } else {
        map.delete(arg);
        return true;
      }
    } else {
      return false;
    }
  }
}


export function DeepMapClear(map: Map<any, any>, keys: any[] = []): boolean {
  if (keys.length === 0) {
    map.clear();
    return true;
  } else {
    let entry: any;
    let i: number = 0;
    let arg: any;
    const length: number = keys.length;
    const lengthMinusOne: number = length - 1;

    while (true) {
      arg = (i < length) ? keys[i] : void 0;
      if (map.has(arg)) {
        entry = map.get(arg);
        if (entry instanceof Map) {
          if (i < lengthMinusOne) {
            map = entry;
            i++;
          } else {
            map.set(arg, entry.get(void 0));
            entry.clear();
            return true;
          }
        } else {
          map.delete(arg);
          return true;
        }
      } else {
        return false;
      }
    }
  }
}

export function DeepMapGetPartialOld(map: Map<any, any>, keys: any[]): Map<any, any> | any | undefined {
  if (keys.length === 0) {
    return map;
  } else {
    let entry: any;
    let i: number = 0;
    let arg: any;
    const length: number = keys.length;
    const lengthMinusOne: number = length - 1;

    while (true) {
      arg = (i < length) ? keys[i] : void 0;
      if (map.has(arg)) {
        entry = map.get(arg);
        if (entry instanceof Map) {
          if (i < lengthMinusOne) {
            map = entry;
            i++;
          } else {
            return entry;
          }
        } else {
          return (i < length)
            ? entry
            : void 0;
        }
      } else {
        return void 0;
      }
    }
  }
}

export function DeepMapGetPartial(map: Map<any, any>, keys: any[]): Map<any, any> | any | undefined {
  let key: any;
  for (let i = 0, l = keys.length; i < l; i++) {
    key = keys[i];
    if ((map instanceof Map) && map.has(key)) {
      map = map.get(key);
    } else {
      return void 0;
    }
  }

  return map;
}

export function * DeepMapEntries<T>(map: Map<any, any>, keys: any[] = []): IterableIterator<[any[], T]> {
  const iterator: IterableIterator<[any, any]> = map.entries();
  let entry: IteratorResult<[any, any]>;
  let value: any;

  while (!(entry = iterator.next()).done) {
    value = entry.value[1];
    const _keys: any[] = keys.concat([entry.value[0]]);
    if (value instanceof Map) {
      yield * DeepMapEntries(value, _keys) as any;
    } else {
      while ((_keys.length > 0) && (_keys[_keys.length - 1] === void 0)) {
        _keys.pop();
      }
      yield [_keys, value];
    }
  }
}

export function* DeepMapKeys(map: Map<any, any>, keys: any[] = []): IterableIterator<any[]> {
  const iterator: IterableIterator<[any, any]> = map.entries();
  let entry: IteratorResult<[any, any]>;
  let value: any;

  while (!(entry = iterator.next()).done) {
    value = entry.value[1];
    const _keys: any[] = keys.concat([entry.value[0]]);
    if (value instanceof Map) {
      yield* DeepMapKeys(value, _keys) as any;
    } else {
      while ((_keys.length > 0) && (_keys[_keys.length - 1] === void 0)) {
        _keys.pop();
      }
      yield _keys;
    }
  }
}

export function* DeepMapValues<T>(map: Map<any, any>): IterableIterator<T> {
  const iterator: IterableIterator<any> = map.values();
  let entry: IteratorResult<T>;

  while (!(entry = iterator.next()).done) {
    if (entry.value instanceof Map) {
      yield* DeepMapValues(entry.value) as any;
    } else {
      yield entry.value;
    }
  }
}


export function DeepMapForEach<T>(map: Map<any, any>, callback: (entry: T, key: any[], map: any) => void, thisArg: any = map): void {
  const iterator: IterableIterator<[any, any]> = DeepMapEntries<T>(map);
  let entry: IteratorResult<[any, any]>;
  while (!(entry = iterator.next()).done) {
    callback.call(thisArg, entry.value[1], entry.value[0], thisArg);
  }
}


export function DeepMapCompact(map: Map<any, any>): void {
  map.forEach((entry: any, key: any) => {
    if (entry instanceof Map) {
      DeepMapCompact(entry);
      if (entry.size === 0) {
        map.delete(key);
      }
    }
  });
}



/**
 * DeepMap is a Map which accept many keys as key
 */
export class DeepMap<T> implements IDeepMap<T> {

  constructor() {
    ConstructDeepMap(this);
  }

  /**
   * Returns the number of entries in this map.
   */
  get size(): number {
    return DeepMapSize(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  /**
   * Returns false if this map contains some entries.
   */
  get empty(): boolean {
    return DeepMapIsEmpty(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  /**
   * Sets a value, from a key composed of the 'keys' elements, into this map.
   * @param keys
   * @param value
   */
  set(keys: any[], value: T): this {
    DeepMapSet<T>(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, keys, value);
    return this;
  }

  /**
   * Gets the value associated with a key composed of the 'keys' elements.
   * @param keys
   */
  get(keys: any[]): T | undefined {
    return DeepMapGet<T>(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, keys);
  }

  /**
   * Returns true if a values has been set with this key.
   * @param keys
   */
  has(keys: any[]): boolean {
    return DeepMapHas(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, keys);
  }

  /**
   * Removes any value associated with this key.
   * @param keys
   */
  delete(keys: any[]): boolean {
    return DeepMapDelete(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, keys);
  }

  /**
   * Removes all entries.
   */
  clear(keys: any[] = []): boolean {
    return DeepMapClear(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, keys);
  }

  /**
   * Returns a iterable over the list of entries [key, value]
   */
  entries(): IterableIterator<[any[], T]> {
    return DeepMapEntries(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  keys(): IterableIterator<any[]> {
    return DeepMapKeys(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  values(): IterableIterator<T> {
    return DeepMapValues(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  [Symbol.iterator](): IterableIterator<[any[], T]> {
    return DeepMapEntries(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

  forEach(callback: (entry: T, key: any[], map: this) => void): void {
    return DeepMapForEach<T>(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map, callback, this);
  }

  /**
   * Removes unnecessary used space in this map.
   */
  compact(): void {
    return DeepMapCompact(((this as unknown) as IDeepMapInternal<T>)[DEEP_MAP_PRIVATE].map);
  }

}

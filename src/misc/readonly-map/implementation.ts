import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';
import { IReadonlyMap } from './interfaces';

export const READONLY_MAP_PRIVATE = Symbol('readonly-map-private');

export interface IReadonlyMapPrivate<TKey, TValue> {
  map: Map<TKey, TValue>;
}

export interface IReadonlyMapInternal<TKey, TValue> extends IReadonlyMap<TKey, TValue> {
  [READONLY_MAP_PRIVATE]: IReadonlyMapPrivate<TKey, TValue>;
}


export function ConstructReadonlyMap<TKey, TValue>(
  instance: IReadonlyMap<TKey, TValue>,
  entries: Iterable<[TKey, TValue]>
): void {
  ConstructClassWithPrivateMembers(instance, READONLY_MAP_PRIVATE);
  const privates: IReadonlyMapPrivate<TKey, TValue> = (instance as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE];
  if (Symbol.iterator in entries) {
    privates.map = new Map<TKey, TValue>(entries);
  } else {
    throw new TypeError(`Expected Iterable<[TKey, TValue]> as entries`);
  }
}

export function IsReadonlyMap(value: any): value is IReadonlyMap<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(READONLY_MAP_PRIVATE as symbol);
}


export class ReadonlyMap<TKey, TValue> implements IReadonlyMap<TKey, TValue> {

  constructor(entries: Iterable<[TKey, TValue]>) {
    ConstructReadonlyMap<TKey, TValue>(this, entries);
  }

  get size(): number {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.size;
  }

  forEach(callback: (value: TValue, key: TKey, map: IReadonlyMap<TKey, TValue>) => void, thisArg: any = this): void {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.forEach(callback, thisArg);
  }

  get(key: TKey): TValue | undefined {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.get(key);
  }

  has(key: TKey): boolean {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.has(key);
  }

  entries(): IterableIterator<[TKey, TValue]> {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.entries();
  }

  keys(): IterableIterator<TKey> {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.keys();
  }

  values(): IterableIterator<TValue> {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map.values();
  }

  [Symbol.iterator](): IterableIterator<[TKey, TValue]> {
    return ((this as unknown) as IReadonlyMapInternal<TKey, TValue>)[READONLY_MAP_PRIVATE].map[Symbol.iterator]();
  }
}



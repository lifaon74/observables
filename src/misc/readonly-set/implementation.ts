import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';
import { IReadonlySet } from './interfaces';

export const READONLY_SET_PRIVATE = Symbol('readonly-set-private');

export interface IReadonlySetPrivate<TValue> {
  set: Set<TValue>;
}

export interface IReadonlySetPrivatesInternal<TValue> {
  [READONLY_SET_PRIVATE]: IReadonlySetPrivate<TValue>;
}

export interface IReadonlySetInternal<TValue> extends IReadonlySetPrivatesInternal<TValue>, IReadonlySet<TValue> {
}


/** CONSTRUCTOR **/

export function ConstructReadonlySet<TValue>(
  instance: IReadonlySet<TValue>,
  iterable: Iterable<TValue>
): void {
  ConstructClassWithPrivateMembers(instance, READONLY_SET_PRIVATE);
  const privates: IReadonlySetPrivate<TValue> = (instance as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE];
  if (iterable instanceof Set) {
    privates.set = iterable;
  } else if (Symbol.iterator in iterable) {
    privates.set = new Set<TValue>(iterable);
  } else {
    throw new TypeError(`Expected Iterable<[TValue]> as entries`);
  }
}

export function IsReadonlySet(value: any): value is IReadonlySet<any> {
  return IsObject(value)
    && value.hasOwnProperty(READONLY_SET_PRIVATE as symbol);
}


/** CLASS **/

export class ReadonlySet<TValue> implements IReadonlySet<TValue> {

  constructor(iterable: Iterable<TValue>) {
    ConstructReadonlySet<TValue>(this, iterable);
  }

  get size(): number {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.size;
  }

  forEach(callback: (value: TValue, key: TValue, set: IReadonlySet<TValue>) => void, thisArg: any = this): void {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.forEach(callback, thisArg);
  }

  has(value: TValue): boolean {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.has(value);
  }

  entries(): IterableIterator<[TValue, TValue]> {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.entries();
  }

  keys(): IterableIterator<TValue> {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.keys();
  }

  values(): IterableIterator<TValue> {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set.values();
  }

  [Symbol.iterator](): IterableIterator<TValue> {
    return ((this as unknown) as IReadonlySetInternal<TValue>)[READONLY_SET_PRIVATE].set[Symbol.iterator]();
  }
}



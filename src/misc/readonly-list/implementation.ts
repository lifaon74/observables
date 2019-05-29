import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IReadonlyList, IReadonlyTuple, TupleTypes } from './interfaces';
import { IsObject } from '../../helpers';

export const READONLY_TUPLE_PRIVATE = Symbol('readonly-tuple-private');

export interface IReadonlyTuplePrivate<T extends any[]> {
  items: T;
}

export interface IReadonlyTupleInternal<T extends any[]> extends IReadonlyTuple<T> {
  [READONLY_TUPLE_PRIVATE]: IReadonlyTuplePrivate<T>;
}


export function ConstructReadonlyTuple<T extends any[]>(instance: IReadonlyTuple<T>, tuple: T): void {
  ConstructClassWithPrivateMembers(instance, READONLY_TUPLE_PRIVATE);
  if (Array.isArray(tuple)) {
    (instance as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items = tuple;
  } else {
    throw new TypeError(`Expected array as tuple`);
  }
}

export function IsReadonlyTuple(value: any): value is IReadonlyTuple<any> {
  return IsObject(value)
    && value.hasOwnProperty(READONLY_TUPLE_PRIVATE);
}


export class ReadonlyTuple<T extends any[]> implements IReadonlyTuple<T> {

  constructor(tuple: T) {
    ConstructReadonlyTuple<T>(this, tuple);
  }

  get length(): number {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.length;
  }

  item<K extends number>(index: K): T[K] {
    if ((0 <= index) && (index < ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.length)) {
      return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items[index];
    } else {
      throw new RangeError(`Index out of range.`);
    }
  }

  [Symbol.iterator](): IterableIterator<TupleTypes<T>> {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items[Symbol.iterator]();
  }

  // *[Symbol.iterator](): IterableIterator<T> {
  //   for (let i = 0, l = ((this as unknown) as IReadonlyListInternal<T>)[READONLY_LIST_PRIVATE].items.length; i < l; i++) {
  //     yield ((this as unknown) as IReadonlyListInternal<T>)[READONLY_LIST_PRIVATE].items[i];
  //   }
  // }

  toString(): string {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.toString();
  }


  join(separator?: string): string {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.join(separator);
  }

  indexOf(searchElement: TupleTypes<T>, fromIndex?: number): number {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.indexOf(searchElement, fromIndex);
  }

  lastIndexOf(searchElement: TupleTypes<T>, fromIndex?: number): number {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.lastIndexOf(searchElement, fromIndex);
  }

  includes(searchElement: TupleTypes<T>, fromIndex?: number): boolean {
    return ((this as unknown) as IReadonlyTupleInternal<T>)[READONLY_TUPLE_PRIVATE].items.includes(searchElement as any, fromIndex);
  }
}


/*----------------------------------*/


export interface IReadonlyListInternal<T> extends IReadonlyTupleInternal<T[]> {
}

export function IsReadonlyList(value: any): value is IReadonlyList<any> {
  return IsObject(value)
    // && value.hasOwnProperty(READONLY_LIST_PRIVATE);
    && (value instanceof ReadonlyList);
}

export class ReadonlyList<T> extends ReadonlyTuple<T[]> implements IReadonlyList<T> {

  constructor(iterable: Iterable<T>) {
    super(Array.isArray(iterable) ? iterable : Array.from(iterable));
  }

  concat(...items: (T | ConcatArray<T>)[]): T[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.concat(...items);
  }

  reverse(): T[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.slice().reverse();
  }

  slice(start?: number, end?: number): T[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.slice(start, end);
  }

  sort(compareFn?: (a: T, b: T) => number): T[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.slice().sort();
  }

  every(callback: (value: T, index: number, array: T[]) => boolean, thisArg: any = this): boolean {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.every(callback, thisArg);
  }

  some(callback: (value: T, index: number, array: T[]) => boolean, thisArg: any = this): boolean {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.some(callback, thisArg);
  }

  forEach(callback: (value: T, index: number, array: T[]) => void, thisArg: any = this): void {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.forEach(callback, thisArg);
  }

  map<U>(callback: (value: T, index: number, array: T[]) => U, thisArg: any = this): U[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.map(callback, thisArg);
  }

  filter<S extends T>(callback: (value: T, index: number, array: T[]) => value is S, thisArg: any = this): S[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.filter(callback, thisArg);
  }

  reduce<U>(callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.reduce<U>(callback, initialValue);
  }

  reduceRight<U>(callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.reduceRight<U>(callback, initialValue);
  }

  flatMap<U>(callback: (value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg: any = this): U[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.flatMap<U>(callback, thisArg);
  }

  flat<U>(depth?: number): U[] {
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.flat<U>(depth);
  }

}






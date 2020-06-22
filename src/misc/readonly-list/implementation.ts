import { IReadonlyList } from './interfaces';
import { IsObject } from '../../helpers';
import { ReadonlyTuple } from '../readonly-tuple/implementation';
import { IReadonlyTupleInternal, READONLY_TUPLE_PRIVATE } from '../readonly-tuple/privates';


/** PRIVATES **/

export interface IReadonlyListInternal<T> extends IReadonlyTupleInternal<T[]> {
}

/** CONSTRUCTOR **/

export function IsReadonlyList(value: any): value is IReadonlyList<any> {
  return IsObject(value)
    // && value.hasOwnProperty(READONLY_LIST_PRIVATE);
    && (value instanceof ReadonlyList);
}

/** CLASS **/

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
    return ((this as unknown) as IReadonlyListInternal<T>)[READONLY_TUPLE_PRIVATE].items.flat(depth) as unknown as U[];
  }

}






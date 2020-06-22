import { IReadonlyTuple } from '../readonly-tuple/interfaces';

/** INTERFACES **/

export interface IReadonlyListConstructor {
  new<T>(iterable: Iterable<T>): IReadonlyList<T>;
}

/**
 * A ReadonlyList is a wrapper around an iterable, where its values are readonly.
 */
export interface IReadonlyList<T> extends IReadonlyTuple<T[]> {
  concat(...items: (T | ConcatArray<T>)[]): T[];

  reverse(): T[]; // generates new array
  slice(start?: number, end?: number): T[];

  sort(compareFn?: (a: T, b: T) => number): T[]; // generates new array
  every(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;

  some(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;

  forEach(callback: (value: T, index: number, array: T[]) => void, thisArg?: any): void;

  map<U>(callback: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];

  filter<S extends T>(callback: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[];

  reduce<U>(callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;

  reduceRight<U>(callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;

  flatMap<U>(callback: (value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg?: any): U[];

  flat<U>(depth?: number): U[]; // TODO may improve definition
}

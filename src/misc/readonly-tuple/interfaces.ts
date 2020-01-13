import { TupleTypes } from './types';

/** INTERFACES **/

export interface IReadonlyTupleConstructor {
  new<TTuple extends any[]>(tuple: TTuple): IReadonlyTuple<TTuple>;
}

export interface IReadonlyTuple<TTuple extends any[]> extends Iterable<TupleTypes<TTuple>> {
  readonly length: number;

  // returns value at 'index', or throws if out of range
  item<TKey extends number>(index: TKey): TTuple[TKey];

  toString(): string;

  join(separator?: string): string;

  indexOf(searchElement: TupleTypes<TTuple>, fromIndex?: number): number;

  lastIndexOf(searchElement: TupleTypes<TTuple>, fromIndex?: number): number;

  includes(searchElement: TupleTypes<TTuple>, fromIndex?: number): boolean;
}

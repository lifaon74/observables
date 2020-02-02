import { TupleTypes } from './types';
import { IReadonlyTuple } from './interfaces';
import { IReadonlyTupleInternal, IReadonlyTuplePrivate, READONLY_TUPLE_PRIVATE } from './privates';
import { ConstructReadonlyTuple } from './constructor';

/** METHODS **/

/* GETTERS/SETTERS */

export function ReadonlyTupleGetLength<TTuple extends any[]>(instance: IReadonlyTuple<TTuple>): number {
  return (instance as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.length;
}

/* METHODS */

export function ReadonlyTupleItem<TTuple extends any[], TKey extends number>(instance: IReadonlyTuple<TTuple>, index: TKey): TTuple[TKey] {
  const privates: IReadonlyTuplePrivate<TTuple> = (instance as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE];
  if ((0 <= index) && (index < privates.items.length)) {
    return privates.items[index];
  } else {
    throw new RangeError(`Index out of range.`);
  }
}

/** CLASS **/

export class ReadonlyTuple<TTuple extends any[]> implements IReadonlyTuple<TTuple> {

  constructor(tuple: TTuple) {
    ConstructReadonlyTuple<TTuple>(this, tuple);
  }

  get length(): number {
    return ReadonlyTupleGetLength<TTuple>(this);
  }

  item<TKey extends number>(index: TKey): TTuple[TKey] {
    return ReadonlyTupleItem<TTuple, TKey>(this, index);
  }

  [Symbol.iterator](): IterableIterator<TupleTypes<TTuple>> {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items[Symbol.iterator]();
  }

  // *[Symbol.iterator](): IterableIterator<TTuple> {
  //   for (let i = 0, l = ((this as unknown) as IReadonlyListInternal<TTuple>)[READONLY_LIST_PRIVATE].items.length; i < l; i++) {
  //     yield ((this as unknown) as IReadonlyListInternal<TTuple>)[READONLY_LIST_PRIVATE].items[i];
  //   }
  // }

  toString(): string {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.toString();
  }


  join(separator?: string): string {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.join(separator);
  }

  indexOf(searchElement: TupleTypes<TTuple>, fromIndex?: number): number {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.indexOf(searchElement, fromIndex);
  }

  lastIndexOf(searchElement: TupleTypes<TTuple>, fromIndex?: number): number {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.lastIndexOf(searchElement, fromIndex);
  }

  includes(searchElement: TupleTypes<TTuple>, fromIndex?: number): boolean {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.includes(searchElement as any, fromIndex);
  }

  find<TValue extends TupleTypes<TTuple>>(predicate: (this: void, value: TupleTypes<TTuple>, index: number, obj: TupleTypes<TTuple>[]) => value is TValue, thisArg?: any): TValue | undefined;
  find(predicate: (this: void, value: TupleTypes<TTuple>, index: number, obj: TupleTypes<TTuple>[]) => unknown, thisArg?: any): TupleTypes<TTuple> | undefined;
  find<TValue extends TupleTypes<TTuple>>(predicate: (this: void, value: TupleTypes<TTuple>, index: number, obj: TupleTypes<TTuple>[]) => boolean, thisArg: any = this): TValue | undefined {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.find(predicate, thisArg);
  }

  findIndex(predicate: (value: TupleTypes<TTuple>, index: number, obj: TupleTypes<TTuple>[]) => unknown, thisArg: any = this): number {
    return ((this as unknown) as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items.findIndex(predicate, thisArg);
  }
}

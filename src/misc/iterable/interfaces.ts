
export interface Iterable<Tin, Tout> {
  [Symbol.iterator](): Iterator<Tin, Tout>;
}

export interface IteratorResult<T> {
  value: T | undefined;
  done: boolean;
}

export interface Iterator<Tin, Tout> {
  next(value?: Tin): IteratorResult<Tout>;
  return?(value?: any): IteratorResult<Tout>;
  throw?(e?: any): IteratorResult<Tout>;
}

export interface IterableIterator<Tin, Tout> extends Iterable<Tin, Tout>, Iterator<Tin, Tout> {}

export type IterableForEachCallback<TKey, TValue> = (value: TValue, key: TKey, iterable: any) => void;

export interface IterableMap<TKey, TValue> {
  entries(): IterableIterator<void, [TKey, TValue]>;
  keys(): IterableIterator<void, TKey>;
  values(): IterableIterator<void, TValue>;
  [Symbol.iterator](): IterableIterator<void, [TKey, TValue]>;

  forEach(callback: IterableForEachCallback<TKey, TValue>): void;
}


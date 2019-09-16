
export interface IReadonlyMapConstructor  {
  new<TKey, TValue>(entries: Iterable<[TKey, TValue]>): IReadonlyMap<TKey, TValue>;
}

export interface IReadonlyMap<TKey, TValue> extends ReadonlyMap<TKey, TValue> {
  readonly size: number;

  forEach(callback: (value: TValue, key: TKey, map: IReadonlyMap<TKey, TValue>) => void, thisArg?: any): void;
  get(key: TKey): TValue | undefined;
  has(key: TKey): boolean;

  entries(): IterableIterator<[TKey, TValue]>;
  keys(): IterableIterator<TKey>;
  values(): IterableIterator<TValue>;

  [Symbol.iterator](): IterableIterator<[TKey, TValue]>;
}



/** INTERFACES **/

export interface IReadonlySetConstructor {
  new<TValue>(values: Iterable<TValue>): IReadonlySet<TValue>;
}

export interface IReadonlySet<TValue> extends ReadonlySet<TValue> {
  readonly size: number;

  forEach(callback: (value: TValue, key: TValue, set: IReadonlySet<TValue>) => void, thisArg?: any): void;

  has(value: TValue): boolean;

  entries(): IterableIterator<[TValue, TValue]>;

  keys(): IterableIterator<TValue>;

  values(): IterableIterator<TValue>;

  [Symbol.iterator](): IterableIterator<TValue>;
}


/** ITERATOR **/

export type TSyncOrAsyncIterator<T = any> = Iterator<T> | AsyncIterator<T>;

export type TInferSyncOrAsyncIteratorValueType<TIterator extends TSyncOrAsyncIterator<any>> = TIterator extends Iterator<infer TValue>
  ? TValue
  : (
    TIterator extends AsyncIterator<infer TValue>
      ? TValue
      : never
    );


/** ITERABLE **/

export type TSyncOrAsyncIterable<T = any> = Iterable<T> | AsyncIterable<T>;

export type TInferSyncOrAsyncIterableValueType<TIterable extends TSyncOrAsyncIterable<any>> = TIterable extends Iterable<infer TValue>
  ? TValue
  : (
    TIterable extends AsyncIterable<infer TValue>
      ? TValue
      : never
    );

export type TInferSyncOrAsyncIterableIterator<TIterable extends TSyncOrAsyncIterable<any>> = TIterable extends Iterable<infer TValue>
  ? Iterator<TValue>
  : TIterable extends AsyncIterable<infer TValue>
    ? AsyncIterator<TValue>
    : never;

export type TInferSyncOrAsyncIterableGenerator<TIterable extends TSyncOrAsyncIterable<any>> = () => TInferSyncOrAsyncIterableIterator<TIterable>;

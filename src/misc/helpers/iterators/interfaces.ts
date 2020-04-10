import { ITask } from '../../../notifications/observables/task/interfaces';

/** ITERATOR **/

export type TSyncOrAsyncIterator<T = any, TReturn = any, TNext = undefined> = Iterator<T, TReturn, TNext> | AsyncIterator<T, TReturn, TNext>;

export type TInferSyncOrAsyncIteratorValueType<TIterator extends TSyncOrAsyncIterator> = TIterator extends Iterator<infer TValue>
  ? TValue
  : (
    TIterator extends AsyncIterator<infer TValue>
      ? TValue
      : never
    );


/** ITERABLE **/

export type TSyncOrAsyncIterable<T = any> = Iterable<T> | AsyncIterable<T>;

export type TInferSyncOrAsyncIterableValueType<TIterable extends TSyncOrAsyncIterable> = TIterable extends Iterable<infer TValue>
  ? TValue
  : (
    TIterable extends AsyncIterable<infer TValue>
      ? TValue
      : never
    );

export type TInferSyncOrAsyncIterableIterator<TIterable extends TSyncOrAsyncIterable> = TIterable extends Iterable<infer TValue>
  ? Iterator<TValue>
  : TIterable extends AsyncIterable<infer TValue>
    ? AsyncIterator<TValue>
    : never;

export type TInferSyncOrAsyncIterableGenerator<TIterable extends TSyncOrAsyncIterable> = () => TInferSyncOrAsyncIterableIterator<TIterable>;


/** GENERATOR **/

export type TSyncOrAsyncGenerator<T = unknown, TReturn = any, TNext = unknown> = Generator<T, TReturn, TNext> | AsyncGenerator<T, TReturn, TNext>;

export type TInferSyncOrAsyncGeneratorValueType<TGenerator extends TSyncOrAsyncGenerator> = TGenerator extends Generator<infer TValue>
  ? TValue
  : (
    TGenerator extends AsyncIterator<infer TValue>
      ? TValue
      : never
    );


export type TSyncOrAsyncGeneratorFunction<T = unknown, TReturn = any, TNext = unknown> = (...args: any[]) => TSyncOrAsyncGenerator<T, TReturn, TNext>;

export type TInferSyncOrAsyncGeneratorFunctionValueType<TGeneratorFunction extends TSyncOrAsyncGeneratorFunction> = TInferSyncOrAsyncGeneratorValueType<ReturnType<TGeneratorFunction>>;

import { PromiseTry } from '../types/helpers';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IsAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/constructor';
import { TNativePromiseLikeOrValue, TNativePromiseLikeOrValueFactory } from '../types/native';

/**
 * INFO:
 *  - IterableIterator<Promise<T>> !== AsyncIterator<T>
 *    -> AsyncIterator<T> waits for the previous next to complete before resolving the current next
 *    -> IterableIterator<Promise<T>> immediately returns a Promise
 */

/**
 * Converts a list of promise factories into an iterator of promises
 */
export function * PromiseFactoriesIteratorToPromiseIterable<T>(iterator: Iterator<TNativePromiseLikeOrValueFactory<T>>): IterableIterator<Promise<T>> {
  let result: IteratorResult<TNativePromiseLikeOrValueFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(result.value);
  }
}

/**
 * Runs in parallel up to 'concurrent' promises
 */
export function RunConcurrentPromises<T>(iterator: Iterator<TNativePromiseLikeOrValue<T>>, concurrent: number = 1, signal?: IAdvancedAbortSignal): Promise<void> {
  // ensures job is cancelled if one of the promise rejects or if the token is cancelled manually
  let errored: boolean = false;
  let next = (): TNativePromiseLikeOrValue<void> => {
    if (!errored) {
      const result: IteratorResult<TNativePromiseLikeOrValue<T>> = iterator.next();
      if (!result.done) {
        return Promise.resolve(result.value).then(next);
      }
    }
  };

  if (IsAdvancedAbortSignal(signal)) {
    next = signal.wrapFunction<() => TNativePromiseLikeOrValue<void>, 'never', never>(next);
  }

  return Promise.all(
    Array.from({ length: concurrent }, next)
  ).then(() => void 0, (error: any) => {
    errored = true;
    throw error;
  });
}

import { ICancelToken } from '../../misc/cancel-token/interfaces';
import { TPromiseOrValue, TPromiseOrValueFactory } from '../interfaces';
import { PromiseTry } from '../helpers';
import { IsCancelToken } from '../../misc/cancel-token/implementation';

/**
 * INFO:
 *  - IterableIterator<Promise<T>> !== AsyncIterator<T>
 *    -> AsyncIterator<T> waits for the previous next to complete before resolving the current next
 *    -> IterableIterator<Promise<T>> immediately returns a Promise
 */

/**
 * Converts a list of promise factories to an iterator of promises
 * @param iterator
 */
export function * PromiseFactoriesIteratorToPromiseIterable<T>(iterator: Iterator<TPromiseOrValueFactory<T>>): IterableIterator<Promise<T>> {
  let result: IteratorResult<TPromiseOrValueFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(result.value);
  }
}

/**
 * Runs in parallel up to 'concurrent' promises
 * @param iterator
 * @param concurrent
 * @param token
 */
export function RunConcurrentPromises<T>(iterator: Iterator<TPromiseOrValue<T>>, concurrent: number = 1, token?: ICancelToken): Promise<void> {
  // ensures job is cancelled if one of the promise rejects or if the token is cancelled manually
  let errored: boolean = false;
  let next = (): TPromiseOrValue<void> => {
    if (!errored) {
      const result: IteratorResult<TPromiseOrValue<T>> = iterator.next();
      if (!result.done) {
        return Promise.resolve(result.value).then(next);
      }
    }
  };

  if (IsCancelToken(token)) {
    next = token.wrapFunction<() => TPromiseOrValue<void>, 'never', never>(next);
  }

  return Promise.all(
    Array.from({ length: concurrent }, next)
  ).then(() => void 0, (error: any) => {
    errored = true;
    throw error;
  });
}

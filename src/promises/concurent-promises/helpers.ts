import { ICancelToken } from '../../misc/cancel-token/interfaces';
import { TPromiseOrValue, TPromiseOrValueFactory } from '../interfaces';
import { PromiseTry } from '../helpers';
import { CancelToken } from '../../misc/cancel-token/implementation';

export function * PromiseFactoriesIteratorToPromiseIterable<T>(iterator: Iterator<TPromiseOrValueFactory<T>>): IterableIterator<Promise<T>> {
  let result: IteratorResult<TPromiseOrValueFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(result.value);
  }
}

export function RunConcurrentPromises<T>(iterator: Iterator<TPromiseOrValue<T>>, concurrent: number = 1, token: ICancelToken = new CancelToken()): Promise<void> {
  const next = token.wrapFunction((): TPromiseOrValue<void> => {
    const result: IteratorResult<TPromiseOrValue<T>> = iterator.next();
    if (!result.done) {
      return Promise.resolve(result.value).then(next);
    }
  });

  return Promise.all(
    Array.from({ length: concurrent }, next)
  ).then(() => void 0, (error: any) => {
    token.cancel(error);
    throw error;
  });
}

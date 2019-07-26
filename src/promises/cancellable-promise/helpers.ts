import { ICancellablePromise } from './interfaces';
import { setImmediate, clearImmediate } from '../../classes/set-immediate';
import { CancellablePromise } from './implementation';
import {
  ICancelToken, TCancelStrategy
} from '../../misc/cancel-token/interfaces';
import { TPromiseOrValue } from '../interfaces';
import { Reason } from '../../misc/reason/implementation';

/**
 * Returns a CancellablePromise resolved after 'timeout' milliseconds
 * @param timeout
 * @param token
 * @param strategy
 */
export function $delay(timeout: number, token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<void> {
  return new CancellablePromise<void>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: ICancelToken) => {
    const cancelTokenObserver = token.addListener('cancel', () => {
      clearTimeout(timer);
      cancelTokenObserver.deactivate();
      reject(token.reason);
    });

    const timer = setTimeout(() => {
      cancelTokenObserver.deactivate();
      resolve();
    }, timeout);

    cancelTokenObserver.activate();
  }, token, strategy);
}

/**
 * Returns a CancellablePromise resolved immediately after the environment has completed other operations such as events or display updates.
 * @param token
 * @param strategy
 */
export function $yield(token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<void> {
  return new CancellablePromise<void>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: ICancelToken) => {
    const cancelTokenObserver = token.addListener('cancel', () => {
      clearImmediate(timer);
      cancelTokenObserver.deactivate();
      reject(token.reason);
    });

    const timer = setImmediate(() => {
      cancelTokenObserver.deactivate();
      resolve();
    });

    cancelTokenObserver.activate();
  }, token, strategy);
}


/**
 * Cancels a CancellablePromise after 'timeout' milliseconds
 * @param promise
 * @param timeout
 */
export function $timeout<T>(promise: ICancellablePromise<T>, timeout: number): ICancellablePromise<T> {
  $delay(timeout, promise.token)
    .then(() => {
      promise.token.cancel(new Reason<string>(`Timeout reached`, 'TIMEOUT'));
    });
  return promise;
}


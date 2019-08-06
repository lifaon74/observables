import { ICancellablePromise, TCancellablePromiseCreateCallback } from './interfaces';
import { setImmediate, clearImmediate } from '../../classes/set-immediate';
import { CancellablePromise } from './implementation';
import {
  ICancelToken, TCancelStrategy
} from '../../misc/cancel-token/interfaces';
import { TPromiseOrValue } from '../interfaces';
import { Reason } from '../../misc/reason/implementation';
import { CancelToken } from '../../misc/cancel-token/implementation';

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
 * Cancels a Promise after 'timeout' milliseconds
 * @param promiseOrCallback
 * @param timeout
 * @param token - should be omitted if promise is a CancellablePromise
 * @param strategy - should be omitted if promise is a CancellablePromise
 */
export function $timeout<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, timeout: number, token?: ICancelToken, strategy?: TCancelStrategy): ICancellablePromise<T> {
  const promise: ICancellablePromise<T> = CancellablePromise.of<T>(promiseOrCallback, token, strategy);

  const delayToken: ICancelToken = new CancelToken();
  delayToken.linkWithToken(promise.token);

  $delay(timeout, delayToken)
    .then(() => {
      promise.token.cancel(new Reason<string>(`Timeout reached`, 'TIMEOUT'));
    });

  return promise
    .finally(() => {
      delayToken.cancel();
    });
}

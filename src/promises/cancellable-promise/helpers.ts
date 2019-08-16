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
 */
export function $delay(timeout: number, token?: ICancelToken): ICancellablePromise<void, 'never'>;
export function $delay<TStrategy extends TCancelStrategy>(timeout: number, token: ICancelToken, strategy: TStrategy): ICancellablePromise<void, TStrategy>;
export function $delay<TStrategy extends TCancelStrategy>(timeout: number, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<void, TStrategy> {
  return new CancellablePromise<void, TStrategy>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: ICancelToken) => {
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
 */
export function $yield(token?: ICancelToken): ICancellablePromise<void, 'never'>;
export function $yield<TStrategy extends TCancelStrategy>(token: ICancelToken, strategy: TStrategy): ICancellablePromise<void, TStrategy>;
export function $yield<TStrategy extends TCancelStrategy>(token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<void, TStrategy> {
  return new CancellablePromise<void, TStrategy>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: ICancelToken) => {
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
 *  -> 'token' and 'strategy' should be omitted if 'promiseOrCallback' is a CancellablePromise
 */
export function $timeout<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, 'never'>, timeout: number, token?: ICancelToken): ICancellablePromise<T, 'never'>;
export function $timeout<T, TStrategy extends TCancelStrategy>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, timeout: number, token: ICancelToken, strategy: TStrategy): ICancellablePromise<T, TStrategy>;
export function $timeout<T, TStrategy extends TCancelStrategy>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, timeout: number, token?: ICancelToken, strategy?: TStrategy): ICancellablePromise<T, TStrategy> {
  const promise: ICancellablePromise<T, TStrategy> = CancellablePromise.of<T, TStrategy>(promiseOrCallback, token, strategy as TStrategy);

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

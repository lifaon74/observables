import { ICancellablePromise } from './interfaces';
import { setImmediate, clearImmediate } from '../../classes/set-immediate';
import { CancellablePromise } from './implementation';
import {
  IPromiseCancelToken, TCancelStrategy
} from '../../notifications/observables/complete-state/promise-observable/promise-cancel-token/interfaces';
import { TPromiseOrValue } from '../interfaces';
import { Reason } from '../../misc/reason/implementation';

/**
 * Returns a CancellablePromise resolved after 'timeout' milliseconds
 * @param timeout
 * @param token
 * @param strategy
 */
export function $delay(timeout: number, token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<void> {
  return new CancellablePromise<void>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: IPromiseCancelToken) => {
    const promiseCancelTokenObserver = token.addListener('cancel', () => {
      clearTimeout(timer);
      promiseCancelTokenObserver.deactivate();
      reject(token.reason);
    });

    const timer = setTimeout(() => {
      promiseCancelTokenObserver.deactivate();
      resolve();
    }, timeout);

    promiseCancelTokenObserver.activate();
  }, token, strategy);
}

/**
 * Returns a CancellablePromise resolved immediately after the environment has completed other operations such as events or display updates.
 * @param token
 * @param strategy
 */
export function $yield(token?: IPromiseCancelToken, strategy?: TCancelStrategy): ICancellablePromise<void> {
  return new CancellablePromise<void>((resolve: (value?: TPromiseOrValue<void>) => void, reject: (reason?: any) => void, token: IPromiseCancelToken) => {
    const promiseCancelTokenObserver = token.addListener('cancel', () => {
      clearImmediate(timer);
      promiseCancelTokenObserver.deactivate();
      reject(token.reason);
    });

    const timer = setImmediate(() => {
      promiseCancelTokenObserver.deactivate();
      resolve();
    });

    promiseCancelTokenObserver.activate();
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


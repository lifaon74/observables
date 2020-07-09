import { ICancellablePromise } from './interfaces';
import { clearImmediate, setImmediate } from '../../misc/helpers/event-loop/set-immediate';
import { CancellablePromise } from './implementation';
import { ICancellablePromiseOptions } from './types';
import { TNativePromiseLikeOrValue } from '../types/native';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

/**
 * Returns a Promise or a CancellablePromise resolved after 'timeout' milliseconds
 */
export function $delay(timeout: number): Promise<void>;
export function $delay(timeout: number, options: ICancellablePromiseOptions): ICancellablePromise<void>;
export function $delay(timeout: number, options?: ICancellablePromiseOptions): Promise<void> | ICancellablePromise<void> {
  if (options === void 0) {
    return new Promise<void>((resolve: (value?: TNativePromiseLikeOrValue<void>) => void) => {
      setTimeout(resolve, timeout);
    });
  } else {
    return new CancellablePromise<void>((
      resolve: (value?: TNativePromiseLikeOrValue<void>) => void,
      reject: (reason?: any) => void,
      signal: IAdvancedAbortSignal
    ) => {
      const abortSignalObserver = signal.addListener('abort', () => {
        clearTimeout(timer);
        abortSignalObserver.deactivate();
        reject(signal.reason);
      });

      const timer = setTimeout(() => {
        abortSignalObserver.deactivate();
        resolve();
      }, timeout);

      abortSignalObserver.activate();
    }, options);
  }
}

// const a1 = $delay(10);
// const a2 = $delay(10, 1 as unknown as IAdvancedAbortSignal);
// const a3 = $delay<'reject'>(10, 1 as unknown as IAdvancedAbortSignal, 2 as any);

/**
 * Returns a Promise or a CancellablePromise resolved immediately after the environment has completed other operations such as events or display updates.
 */
export function $yield(): Promise<void>;
export function $yield(options: ICancellablePromiseOptions): ICancellablePromise<void>;
export function $yield(options?: ICancellablePromiseOptions): Promise<void> | ICancellablePromise<void> {
  if (options === void 0) {
    return new Promise<void>((resolve: (value?: TNativePromiseLikeOrValue<void>) => void) => {
      setImmediate(resolve);
    });
  } else {
    return new CancellablePromise<void>((
      resolve: (value?: TNativePromiseLikeOrValue<void>) => void,
      reject: (reason?: any) => void,
      signal: IAdvancedAbortSignal
    ) => {
      const abortSignalObserver = signal.addListener('abort', () => {
        clearImmediate(timer);
        abortSignalObserver.deactivate();
        reject(signal.reason);
      });

      const timer = setImmediate(() => {
        abortSignalObserver.deactivate();
        resolve();
      });

      abortSignalObserver.activate();
    }, options);
  }
}

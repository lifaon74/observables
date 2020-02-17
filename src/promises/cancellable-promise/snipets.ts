import { ICancellablePromise } from './interfaces';
import { clearImmediate, setImmediate } from '../../classes/set-immediate';
import { CancellablePromise } from './implementation';
import { TPromiseOrValue } from '../interfaces';
import { ICancellablePromiseOptions } from './types';
import { TAbortStrategy } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';

/**
 * Returns a Promise or a CancellablePromise resolved after 'timeout' milliseconds
 */
export function $delay(timeout: number): Promise<void>;
export function $delay(timeout: number, options: ICancellablePromiseOptions<'never'>): ICancellablePromise<void, 'never'>;
export function $delay<TStrategy extends TAbortStrategy>(timeout: number, options: ICancellablePromiseOptions<TStrategy>): ICancellablePromise<void, TStrategy>;
export function $delay<TStrategy extends TAbortStrategy>(timeout: number, options?: ICancellablePromiseOptions<TStrategy>): Promise<void> | ICancellablePromise<void, TStrategy> {
  if (options === void 0) {
    return new Promise<void>((resolve: (value?: TPromiseOrValue<void>) => void) => {
      setTimeout(resolve, timeout);
    });
  } else {
    return new CancellablePromise<void, TStrategy>((
      resolve: (value?: TPromiseOrValue<void>) => void,
      reject: (reason?: any) => void,
      cancellablePromise: ICancellablePromise<void, TStrategy>
    ) => {
      const abortSignalObserver = cancellablePromise.signal.addListener('abort', () => {
        clearTimeout(timer);
        abortSignalObserver.deactivate();
        reject(cancellablePromise.signal.reason);
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
export function $yield(options: ICancellablePromiseOptions<'never'> | undefined): ICancellablePromise<void, 'never'>;
export function $yield<TStrategy extends TAbortStrategy>(options: ICancellablePromiseOptions<TStrategy>): ICancellablePromise<void, TStrategy>;
export function $yield<TStrategy extends TAbortStrategy>(options?: ICancellablePromiseOptions<TStrategy>): Promise<void> | ICancellablePromise<void, TStrategy> {
  if (options === void 0) {
    return new Promise<void>((resolve: (value?: TPromiseOrValue<void>) => void) => {
      setImmediate(resolve);
    });
  } else {
    return new CancellablePromise<void, TStrategy>((
      resolve: (value?: TPromiseOrValue<void>) => void,
      reject: (reason?: any) => void,
      cancellablePromise: ICancellablePromise<void, TStrategy>
    ) => {
      const abortSignalObserver = cancellablePromise.signal.addListener('abort', () => {
        clearImmediate(timer);
        abortSignalObserver.deactivate();
        reject(cancellablePromise.signal.reason);
      });

      const timer = setImmediate(() => {
        abortSignalObserver.deactivate();
        resolve();
      });

      abortSignalObserver.activate();
    }, options);
  }
}

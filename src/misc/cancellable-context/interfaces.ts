import { IAdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/interfaces';
import { TPromiseOrValue } from '../../promises/interfaces';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { IActivableLike } from '../activable/interfaces';

export type TRegisterActivableMode = // if key is already present:
  'skip' // doesn't call the promise factory
  | 'warn' // doesn't call the promise factory and displays a warn message for the developer
  | 'throw' // doesn't call the promise factory and throws an error for the developer
  | 'replace' // cancels the previous promise, then calls the promise factory
  ;

export type TRegisterTaskMode = // if key is already present:
  TRegisterActivableMode
  | 'queue' // waits for previous promise to resolve or reject, then calls the promise factory
  ;

export type TRegisterCallback<T> = (signal: IAdvancedAbortSignal) => TPromiseOrValue<T>;


/**
 * Constraints and registers some promises with special keys, ensuring than promises are executed in order and in some cases are cancelled
 */
export interface ICancellableContext {
  registerTask<T>(
    key: string | any[],
    callback: TRegisterCallback<T>,
    mode?: TRegisterTaskMode,
  ): ICancellablePromise<T>;

  registerActivable<T extends IActivableLike>(
    key: string | any[],
    callback: () => T,
    mode?: TRegisterActivableMode,
  ): ICancellablePromise<void>;

  get(key: string | any[]): ICancellablePromise<any> | undefined;

  clear(key: string | any[]): ICancellablePromise<any> | undefined;

  clearAll(): Promise<void>;
}


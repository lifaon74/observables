import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { IActivableLike } from '../activable/interfaces';
import {
  ICancellableContextRegisterActivableOptions, ICancellableContextRegisterCancellablePromiseOptions,
  TCancellableContextRegisterActivableFactory, TCancellableContextRegisterCancellablePromiseFactory
} from './types';

/** INTERFACES **/

/**
 * Constraints and registers some promises with special keys, ensuring than promises are executed in order and in some cases are cancelled
 */
export interface ICancellableContext {
  registerCancellablePromise<T>(
    key: string | any[],
    factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
    options?: ICancellableContextRegisterCancellablePromiseOptions,
  ): ICancellablePromise<T>;

  registerActivable<TActivable extends IActivableLike>(
    key: string | any[],
    factory: TCancellableContextRegisterActivableFactory<TActivable>,
    options?: ICancellableContextRegisterActivableOptions,
  ): ICancellablePromise<TActivable>;

  get(key: string | any[]): ICancellablePromise<any> | undefined;

  clear(key: string | any[], reason?: any): ICancellablePromise<any> | undefined;

  clearAll(reason?: any): Promise<void>;
}


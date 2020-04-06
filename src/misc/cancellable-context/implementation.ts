import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { ICancellableContext } from './interfaces';
import { IActivableLike } from '../activable/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
import { IAdvancedAbortController } from '../advanced-abort-controller/interfaces';
import { AdvancedAbortController } from '../advanced-abort-controller/implementation';
import {
  ICancellableContextRegisterActivableOptions, ICancellableContextRegisterCancellablePromiseNormalizedOptions,
  ICancellableContextRegisterCancellablePromiseOptions, TCancellableContextRegisterActivableFactory,
  TCancellableContextRegisterCancellablePromiseFactory
} from './types';
import {
  ActivableToCancellablePromise, CancellableContextNormalizeKey,
  NormalizeICancellableContextRegisterCancellablePromiseOptions
} from './functions';
import {
  CANCELLABLE_CONTEXT_PRIVATE, ICancellableContextInternal, ICancellableContextPrivate, ICancellablePromiseAndController
} from './privates';
import { ConstructCancellableContext } from './constructor';
import { AbortReason } from '../reason/built-in/abort-reason';
import { ICancellablePromiseNormalizedOptions } from '../../promises/cancellable-promise/types';
import { AdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/implementation';
import { IAdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/interfaces';


/** METHODS **/

/* PRIVATE/INTERNAL */

/**
 * Registers a CancellablePromise with a specific key.
 *  - Properly clear the map when the promise is resolved or cancelled.
 */
export function CancellableContextPrivateRegisterCancellablePromise<T>(
  instance: ICancellableContext,
  key: any[],
  cancellablePromise: ICancellablePromise<T>,
  controller: IAdvancedAbortController,
): ICancellablePromise<T> {
  const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
  privates.map.set(key, { promise: cancellablePromise, controller });
  return cancellablePromise.finally(() => {
    privates.map.delete(key);
  }, { includeCancelled: true });
}

/**
 * Calls 'factory', generates a CancellablePromise from its result and registers it
 */
export function CancellableContextPrivateRegisterCancellablePromiseFromFactory<T>(
  instance: ICancellableContext,
  key: any[],
  factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
): ICancellablePromise<T> {
  const controller: IAdvancedAbortController = new AdvancedAbortController();
  return CancellableContextPrivateRegisterCancellablePromise<T>(
    instance,
    key,
    CancellablePromise.try<T>(factory, { signal: controller.signal }),
    controller
  );
}

/**
 * Cancels a cancellablePromise and removes it from the map
 */
export function CancellableContextPrivateClear<T>(
  instance: ICancellableContext,
  cancellablePromise: ICancellablePromise<T>,
  controller: IAdvancedAbortController,
  reason?: any,
): ICancellablePromise<T> {
  // INFO: all the cancellable pipeline is cancelled (including .then outside of the factory)
  controller.abort(reason);
  return cancellablePromise;
}


/**
 * Await for 'cancellablePromise' to complete, then calls 'factory'
 */
export function CancellableContextPrivateQueue<T>(
  instance: ICancellableContext,
  cancellablePromise: ICancellablePromise<T>,
  key: any[],
  factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
): ICancellablePromise<T> {
  return cancellablePromise
    .then(
      () => void 0,
      (error: any) => {
        console.warn(error);
      },
      () => void 0
    ) // continues even if previous promise fails
    .then(() => CancellableContextPrivateRegisterCancellablePromiseFromFactory<T>(instance, key, factory)) as ICancellablePromise<T>;
}

/**
 * Cancels 'cancellablePromise', then calls 'factory'
 */
export function CancellableContextPrivateReplace<T>(
  instance: ICancellableContext,
  cancellablePromise: ICancellablePromise<T>,
  controller: IAdvancedAbortController,
  key: any[],
  factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
): ICancellablePromise<T> {
  return CancellableContextPrivateQueue<T>(instance, CancellableContextPrivateClear<T>(instance, cancellablePromise, controller, new AbortReason('Replaced')), key, factory);
}


/* PUBLIC */

export function CancellableContextRegisterCancellablePromise<T>(
  instance: ICancellableContext,
  key: string | any[],
  factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
  options?: ICancellableContextRegisterCancellablePromiseOptions,
): ICancellablePromise<T> {
  const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
  const _key: any[] = CancellableContextNormalizeKey(key);

  if (typeof factory === 'function') {
    if (privates.map.has(_key)) {
      const _options: ICancellableContextRegisterCancellablePromiseNormalizedOptions = NormalizeICancellableContextRegisterCancellablePromiseOptions(options);
      const promiseAndController: ICancellablePromiseAndController<T> = privates.map.get(_key) as ICancellablePromiseAndController<T>;

      switch (_options.mode) {
        case 'skip':
          return promiseAndController.promise;
        case 'throw':
          return CancellablePromise.reject(new Error(`Key '${ key }' uniq and already in use`));
        case 'warn':
          console.warn(`Key '${ key }' uniq and already in use => skipped`);
          return promiseAndController.promise;
        case 'replace':
          return CancellableContextPrivateReplace<T>(instance, promiseAndController.promise, promiseAndController.controller, _key, factory);
        case 'queue':
          return CancellableContextPrivateQueue<T>(instance, promiseAndController.promise, _key, factory);
        default:
          throw new TypeError(`Invalid mode ${ _options.mode }`);
      }
    } else {
      return CancellableContextPrivateRegisterCancellablePromiseFromFactory<T>(instance, _key, factory);
    }
  } else {
    throw new TypeError(`Expected function as factory`);
  }
}

export function CancellableContextRegisterActivable<TActivable extends IActivableLike>(
  instance: ICancellableContext,
  key: string | any[],
  factory: TCancellableContextRegisterActivableFactory<TActivable>,
  options?: ICancellableContextRegisterActivableOptions,
): ICancellablePromise<TActivable> {
  return CancellableContextRegisterCancellablePromise<TActivable>(instance, key, (signal: IAdvancedAbortSignal) => {
    const activable: TActivable = factory();
    return ActivableToCancellablePromise(activable, { signal })
      .then(() => activable);
  }, options);
}

export function CancellableContextGet(
  instance: ICancellableContext,
  key: string | any[],
): ICancellablePromise<any> | undefined {
  return ((instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.get(CancellableContextNormalizeKey(key)) as ICancellablePromiseAndController<any>).promise;
}

export function CancellableContextClear(
  instance: ICancellableContext,
  key: string | any[],
  reason?: any,
): ICancellablePromise<any> | undefined {
  const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
  const _key: any[] = CancellableContextNormalizeKey(key);
  if (privates.map.has(_key)) {
    const promiseAndController: ICancellablePromiseAndController<any> = privates.map.get(_key) as ICancellablePromiseAndController<any>;
    return CancellableContextPrivateClear<any>(instance, promiseAndController.promise, promiseAndController.controller, reason);
  } else {
    return void 0;
  }
}

export function CancellableContextClearAll(
  instance: ICancellableContext,
  reason?: any,
): Promise<void> {
  const unsubscribe = (): Promise<void> => {
    const iterator: IterableIterator<[any[], ICancellablePromiseAndController<any>]> =
      (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.entries();
    const result: IteratorResult<[any[], ICancellablePromiseAndController<any>]> = iterator.next();

    if (result.done) {
      return Promise.resolve();
    } else {
      const promiseAndController: ICancellablePromiseAndController<any> = result.value[1];
      return CancellableContextPrivateClear<any>(instance, promiseAndController.promise, promiseAndController.controller, reason).finally(unsubscribe, { includeCancelled: true });
    }
  };

  return unsubscribe();
}


/** CLASS **/

export class CancellableContext implements ICancellableContext {

  constructor() {
    ConstructCancellableContext(this);
  }

  registerCancellablePromise<T>(
    key: string | any[],
    factory: TCancellableContextRegisterCancellablePromiseFactory<T>,
    options?: ICancellableContextRegisterCancellablePromiseOptions,
  ): ICancellablePromise<T> {
    return CancellableContextRegisterCancellablePromise<T>(this, key, factory, options);
  }

  registerActivable<TActivable extends IActivableLike>(
    key: string | any[],
    factory: TCancellableContextRegisterActivableFactory<TActivable>,
    options?: ICancellableContextRegisterActivableOptions,
  ): ICancellablePromise<TActivable> {
    return CancellableContextRegisterActivable<TActivable>(this, key, factory, options);
  }

  get(key: string | any[]): ICancellablePromise<any> | undefined {
    return CancellableContextGet(this, key);
  }


  clear(key: string | any[], reason?: any): ICancellablePromise<any> | undefined {
    return CancellableContextClear(this, key, reason);
  }

  clearAll(reason?: any): Promise<void> {
    return CancellableContextClearAll(this, reason);
  }
}




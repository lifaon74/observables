import { NotificationsObservable } from '../../../notifications/core/notifications-observable/implementation';
import { INotificationsObservableContext } from '../../../notifications/core/notifications-observable/context/interfaces';
import { IAdvancedAbortSignal, IAdvancedAbortSignalConstructor, IAdvancedAbortSignalKeyValueMap } from './interfaces';
import { AllowAdvancedAbortSignalConstruct, ConstructAdvancedAbortSignal } from './constructor';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal } from './privates';
import { INotificationsObserver } from '../../../notifications/core/notifications-observer/interfaces';

import { TPromise, TPromiseOrValue, TPromiseType } from '../../../promises/interfaces';
import {
  IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TAbortStrategyReturn, TAbortStrategyReturnedPromise,
  TAdvancedAbortSignalWrapPromiseCallback
} from './types';
import {
  AdvancedAbortSignalNormalizeWrapPromiseOptions, ApplyOnAbortCallback, IAdvancedAbortSignalWrapPromiseOptionsStrict,
  LinkAdvancedAbortSignalWithFetchArgumentsSpread, RaceAborted
} from './functions';
import { IsPromiseLikeBase, PromiseTry } from '../../../promises/helpers';
import { setImmediate, clearImmediate } from '../../../classes/set-immediate';


/** NEW **/

export function NewAdvancedAbortSignal(): IAdvancedAbortSignal {
  AllowAdvancedAbortSignalConstruct(true);
  const signal: IAdvancedAbortSignal = new (AdvancedAbortSignal as IAdvancedAbortSignalConstructor)();
  AllowAdvancedAbortSignalConstruct(false);
  return signal;
}

/** METHODS **/

/* GETTERS/SETTERS */

export function AdvancedAbortSignalGetAborted(instance: IAdvancedAbortSignal): boolean {
  return (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE].aborted;
}

export function AdvancedAbortSignalGetReason(instance: IAdvancedAbortSignal): any {
  return (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE].reason;
}

/* METHODS */


/**
 * Races between the promise and an aborted state.
 *  if abort first, apply strategy
 *  else pass though promise
 */
export function AdvancedAbortSignalWrapPromise<T, TStrategy extends TAbortStrategy, TAborted>(
  instance: IAdvancedAbortSignal,
  promise: TPromise<T>,
  options: IAdvancedAbortSignalWrapPromiseOptionsStrict<TStrategy, TAborted>,
): TAbortStrategyReturnedPromise<T, TStrategy, TAborted> {
  return RaceAborted<T>(instance, promise)
    .then((value: T | void): TPromiseOrValue<T | TAbortStrategyReturn<TStrategy> | TAborted> => {
      return instance.aborted
        ? ApplyOnAbortCallback<TStrategy, TAborted>(instance, options)
        : value as T;
    }, (error: any): TPromiseOrValue<never | TAbortStrategyReturn<TStrategy> | TAborted> => {
      if (instance.aborted) {
        return ApplyOnAbortCallback<TStrategy, TAborted>(instance, options);
      } else {
        throw error;
      }
    });
}

export function AdvancedAbortSignalWrapPromiseOrCreate<T, TStrategy extends TAbortStrategy, TAborted>(
  instance: IAdvancedAbortSignal,
  promiseOrCallback: TPromise<T> | TAdvancedAbortSignalWrapPromiseCallback<T>,
  options: IAdvancedAbortSignalWrapPromiseOptionsStrict<TStrategy, TAborted>,
): TAbortStrategyReturnedPromise<T, TStrategy, TAborted> {
  if (typeof promiseOrCallback === 'function') {
    // ensures promiseOrCallback is called only if signal is not aborted
    return AdvancedAbortSignalWrapFunction<() => TPromise<T>, TStrategy, TAborted>(instance, () => {
      return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
        promiseOrCallback.call(instance, resolve, reject, instance);
      });
    }, options)();
  } else if (IsPromiseLikeBase(promiseOrCallback)) {
    return AdvancedAbortSignalWrapPromise<T, TStrategy, TAborted>(instance, promiseOrCallback, options);
  } else {
    throw new TypeError(`Expected Promise or function as signal.wrapPromise's first argument.`);
  }
}


export function AdvancedAbortSignalWrapFunction<CB extends (...args: any[]) => any, TStrategy extends TAbortStrategy, TAborted>(
  instance: IAdvancedAbortSignal,
  callback: CB,
  options: IAdvancedAbortSignalWrapPromiseOptionsStrict<TStrategy, TAborted>,
): (...args: Parameters<CB>) => TAbortStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TAborted> {
  type T = TPromiseType<ReturnType<CB>>;
  return function (...args: Parameters<CB>): TAbortStrategyReturnedPromise<T, TStrategy, TAborted> {
    return instance.aborted
      ? ApplyOnAbortCallback<TStrategy, TAborted>(instance, options)
      : AdvancedAbortSignalWrapPromise<T, TStrategy, TAborted>(instance, PromiseTry<T>(() => callback.apply(instance, args)), options);
  };
}

export function AdvancedAbortSignalWrapFetchArguments(
  instance: IAdvancedAbortSignal,
  requestInfo: RequestInfo,
  requestInit?: RequestInit
): [RequestInfo, RequestInit | undefined] {
  return LinkAdvancedAbortSignalWithFetchArgumentsSpread(instance, requestInfo, requestInit);
}


export function AdvancedAbortSignalWhenAborted(instance: IAdvancedAbortSignal, callback: (this: IAdvancedAbortSignal, reason: any) => void): () => void {
  if (instance.aborted) {
    const timer = setImmediate(() => callback.call(instance, instance.reason));
    return () => {
      clearImmediate(timer);
    };
  } else {
    const clear = () => {
      listener.deactivate();
    };

    const listener = instance.addListener('abort', () => {
      clear();
      callback.call(instance, instance.reason);
    });

    listener.activate();

    return clear;
  }
}

/**
 * Converts this AdvancedAbortSignal into an AbortController
 *  - if this signal is aborted, then aborts the AbortController
 */
export function AdvancedAbortSignalToAbortController(instance: IAdvancedAbortSignal): AbortController {
  const controller: AbortController = new AbortController();

  if (instance.aborted) {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  } else {
    const clear = () => {
      controller.signal.removeEventListener('abort', clear, false);
      signalListener.deactivate();
    };

    const signalListener: INotificationsObserver<'abort', any> = instance.addListener('abort', () => {
      clear();
      controller.abort();
    });
    signalListener.activate();

    // in the case of controller.signal is aborted, it's no more required to listen to 'abort' from this signal
    controller.signal.addEventListener('abort', clear, false);
  }

  return controller;
}


/** CLASS **/

export class AdvancedAbortSignal extends NotificationsObservable<IAdvancedAbortSignalKeyValueMap> implements IAdvancedAbortSignal {

  protected constructor() {
    let context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>;
    super((_context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructAdvancedAbortSignal(this, context);
  }

  get aborted(): boolean {
    return AdvancedAbortSignalGetAborted(this);
  }

  get reason(): any {
    return AdvancedAbortSignalGetReason(this);
  }

  wrapPromise<T, TStrategy extends TAbortStrategy, TAborted>(
    promiseOrCallback: Promise<T> | TAdvancedAbortSignalWrapPromiseCallback<T>,
    options?: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted>,
  ): TAbortStrategyReturnedPromise<T, TStrategy, TAborted> {
    return AdvancedAbortSignalWrapPromiseOrCreate<T, TStrategy, TAborted>(this, promiseOrCallback, AdvancedAbortSignalNormalizeWrapPromiseOptions(options));
  }

  wrapFunction<CB extends (...args: any[]) => any, TStrategy extends TAbortStrategy, TAborted>(
    callback: CB,
    options?: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted>,
  ): (...args: Parameters<CB>) => TAbortStrategyReturnedPromise<TPromiseType<ReturnType<CB>>, TStrategy, TAborted> {
    return AdvancedAbortSignalWrapFunction<CB, TStrategy, TAborted>(this, callback, AdvancedAbortSignalNormalizeWrapPromiseOptions(options));
  }

  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
    return AdvancedAbortSignalWrapFetchArguments(this, requestInfo, requestInit);
  }

  whenAborted(callback: (this: IAdvancedAbortSignal, reason: any) => void): () => void {
    return AdvancedAbortSignalWhenAborted(this, callback);
  }

  toAbortController(): AbortController {
    return AdvancedAbortSignalToAbortController(this);
  }
}

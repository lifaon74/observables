import { IAdvancedAbortSignal } from './interfaces';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal, IAdvancedAbortSignalPrivate } from './privates';
import { AbortNotification } from '../abort-notification';
import { IsObject } from '../../../helpers';
import { TAbortStrategy, TInferAbortStrategyReturn } from './types';
import { NEVER_PROMISE, PromiseFinally, PromiseTry, VOID_PROMISE, } from '../../../promises/types/helpers';
import { INotificationsObserver } from '../../../notifications/core/notifications-observer/interfaces';
import { AdvancedAbortController } from '../implementation';
import { IAdvancedAbortController } from '../interfaces';
import { IAdvancedAbortSignalWrapPromiseNormalizedOptions } from './helpers';


/** FUNCTIONS **/

/**
 * Aborts the AdvancedAbortSignal with 'reason'
 */
export function AdvancedAbortSignalAbort(instance: IAdvancedAbortSignal, reason: any = void 0): void {
  const privates: IAdvancedAbortSignalPrivate = (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE];
  if (!privates.aborted) {
    privates.aborted = true;
    privates.reason = reason;
    privates.context.emit(new AbortNotification(reason));
  }
}


/**
 * Returns a Promise with an abort strategy:
 *  - never: never resolves
 *  - resolve: resolves with undefined
 *  - reject: rejects with instance.reason
 */
export function ApplyAbortStrategy<TStrategy extends TAbortStrategy>(strategy?: TStrategy, reason?: string): Promise<TInferAbortStrategyReturn<TStrategy>> {
  switch (strategy) {
    case void 0:
    case 'never':
      return NEVER_PROMISE as Promise<TInferAbortStrategyReturn<TStrategy>>;
    case 'resolve':
      return VOID_PROMISE as unknown as Promise<TInferAbortStrategyReturn<TStrategy>>;
    case 'reject':
      return Promise.reject(reason) as Promise<TInferAbortStrategyReturn<TStrategy>>;
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}

export function ApplyAbortStrategyUsingAdvancedAbortSignalReason<TStrategy extends TAbortStrategy>(
  instance: IAdvancedAbortSignal,
  strategy?: TStrategy,
  reason: string = instance.reason
): Promise<TInferAbortStrategyReturn<TStrategy>> {
  return ApplyAbortStrategy<TStrategy>(strategy, reason);
}


/**
 * Calls the 'onAborted' function
 *  - if undefined => applies specified abort strategy
 *  - else calls 'onAborted' with a new controller, and returns the result wrapped by this controller's signal
 */
export function ApplyOnAbortCallback<TStrategy extends TAbortStrategy, TAborted>(
  instance: IAdvancedAbortSignal,
  options: IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted>,
): Promise<TAborted | TInferAbortStrategyReturn<TStrategy>> {
  type T = TAborted | TInferAbortStrategyReturn<TStrategy>;
  if (typeof options.onAborted === 'function') {
    const newController: IAdvancedAbortController = options.onAbortedController as IAdvancedAbortController;
    return newController.signal.wrapPromise<T, TStrategy, never>(
      PromiseTry<T>(() => (options.onAborted as Function).call(instance, instance.reason, newController)),
      {
        strategy: options.strategy,
      }
    );
  } else {
    return ApplyAbortStrategyUsingAdvancedAbortSignalReason<TStrategy>(instance, options.strategy);
  }
}

/**
 * Returns a Promise resolving as soon as 'promise' is resolved or 'instance' is aborted
 */
export function RaceAborted<T>(
  instance: IAdvancedAbortSignal,
  promise: PromiseLike<T>,
): Promise<T | void> {
  let observer: INotificationsObserver<'abort', void>;
  return Promise.race([
    new Promise<void>((resolve: any) => {
      if (instance.aborted) {
        resolve();
      } else {
        observer = instance.addListener('abort', () => {
          resolve();
        });
        observer.activate();
      }
    }),
    promise
  ])
    .then(...PromiseFinally<T | void>(() => {
      if (observer !== void 0) {
        observer.deactivate();
      }
    }));
}


/**
 * Returns the linked AbortSignal (if exists) of a fetch request
 */
export function ExtractSignalFromFetchArguments(requestInfo: RequestInfo, requestInit: RequestInit = {}): AbortSignal | null {
  if (IsObject(globalThis) && ('AbortController' in globalThis)) {
    if (requestInit.signal instanceof AbortSignal) {
      return requestInit.signal;
    } else if (
      (requestInfo instanceof Request)
      && (requestInfo.signal instanceof AbortSignal)
    ) {
      return requestInfo.signal;
    } else {
      return null;
    }
  } else {
    return null;
  }
}


/**
 * Links a AdvancedAbortSignal with the fetch arguments.
 * Returns the modified RequestInit
 */
export function LinkAdvancedAbortSignalWithFetchArguments(instance: IAdvancedAbortSignal, requestInfo: RequestInfo, requestInit?: RequestInit): RequestInit | undefined {
  if (IsObject(globalThis) && ('AbortController' in globalThis)) {
    const signal: AbortSignal | null = ExtractSignalFromFetchArguments(requestInfo, requestInit);
    const newSignal: IAdvancedAbortSignal =
      (signal === null)
        ? instance
        : AdvancedAbortController.fromAbortSignals(signal, instance).signal;

    requestInit = (requestInit === void 0)
      ? {}
      : { ...requestInit }; // shallow copy
    requestInit.signal = newSignal.toAbortController().signal;
  }
  return requestInit;
}

/**
 * Just like the previous functions, but simplifies fetch calls:
 *  fetch(...LinkAdvancedAbortSignalWithFetchArgumentsSpread(instance, requestInfo, requestInit))
 */
export function LinkAdvancedAbortSignalWithFetchArgumentsSpread(instance: IAdvancedAbortSignal, requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined] {
  return [requestInfo, LinkAdvancedAbortSignalWithFetchArguments(instance, requestInfo, requestInit)];
}

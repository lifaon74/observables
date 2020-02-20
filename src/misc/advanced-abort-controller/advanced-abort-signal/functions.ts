import { IAdvancedAbortSignal } from './interfaces';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal, IAdvancedAbortSignalPrivate } from './privates';
import { AbortNotification } from '../abort-notification';
import { IsObject } from '../../../helpers';
import { IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TInferAbortStrategyReturn } from './types';
import {
  PromiseFinally, NEVER_PROMISE, PromiseTry, VOID_PROMISE, PromiseFinallyNonConstrained,
  TPromiseFinallySpreadArgumentsNonConstrained
} from '../../../promises/types/helpers';
import { INotificationsObserver } from '../../../notifications/core/notifications-observer/interfaces';
import { AdvancedAbortController } from '../implementation';
import { IAdvancedAbortController } from '../interfaces';
import { IsAdvancedAbortController } from '../constructor';
import { IPromiseLike, KeysOfUnion, TPromiseLikeConstraint } from '../../../promises/types/promise-like';
import {
  IPromise, IPromiseNonConstrained, TMapPromiseLikeOrValueTupleToValueTuple
} from '../../../promises/types/promise';
import { $Promise } from '../../../promises/types/constants';


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
 * Normalizes options provided to AdvancedAbortSignal.wrapPromise
 */
export interface IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy extends TAbortStrategy, TAborted extends TPromiseLikeConstraint<TAborted>> extends IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted> {
  strategy: TStrategy;
}

export function AdvancedAbortSignalNormalizeWrapPromiseOptions<TStrategy extends TAbortStrategy, TAborted extends TPromiseLikeConstraint<TAborted>>(options?: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted>): IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted> {
  const _options: IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted> = {} as IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted>;
  if (options === void 0) {
    options = {};
  } else if (!IsObject(options)) {
    throw new TypeError(`Expected object or void as options`);
  }

  if (options.strategy === void 0) {
    _options.strategy = 'never' as TStrategy;
  } else if (['resolve', 'reject', 'never'].includes(options.strategy)) {
    _options.strategy = options.strategy;
  } else {
    throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as options.strategy`);
  }

  if (options.onAborted === void 0) {
    _options.onAborted = void 0;
  } else if (typeof options.onAborted === 'function') {
    _options.onAborted = options.onAborted;
  } else {
    throw new TypeError(`Expected function or void as options.onAborted`);
  }


  if (options.onAbortedController === void 0) {
    if (_options.onAborted !== void 0) {
      _options.onAbortedController = new AdvancedAbortController();
    }
  } else if (IsAdvancedAbortController(options.onAbortedController)) {
    if (_options.onAborted === void 0) {
      throw new Error(`options.onAbortedController is defined but options.onAborted is missing`);
    } else {
      _options.onAbortedController = options.onAbortedController;
    }
  } else {
    throw new TypeError(`Expected AdvancedAbortController or void as options.onAbortedController`);
  }
  return _options;
}


/**
 * Returns a Promise with an abort strategy:
 *  - never: never resolves
 *  - resolve: resolves with undefined
 *  - reject: rejects with instance.reason
 */
export function ApplyAbortStrategy<TStrategy extends TAbortStrategy>(strategy?: TStrategy, reason?: string): IPromiseNonConstrained<TInferAbortStrategyReturn<TStrategy>> {
  switch (strategy) {
    case void 0:
    case 'never':
      return NEVER_PROMISE as IPromiseNonConstrained<TInferAbortStrategyReturn<TStrategy>>;
    case 'resolve':
      return VOID_PROMISE as unknown as IPromiseNonConstrained<TInferAbortStrategyReturn<TStrategy>>;
    case 'reject':
      return Promise.reject(reason) as IPromiseNonConstrained<TInferAbortStrategyReturn<TStrategy>>;
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}

export function ApplyAbortStrategyUsingAdvancedAbortSignalReason<TStrategy extends TAbortStrategy>(
  instance: IAdvancedAbortSignal,
  strategy?: TStrategy,
  reason: string = instance.reason
): IPromiseNonConstrained<TInferAbortStrategyReturn<TStrategy>> {
  return ApplyAbortStrategy<TStrategy>(strategy, reason);
}


/**
 * Calls the 'onAborted' function
 *  - if undefined => applies specified abort strategy
 *  - else calls 'onAborted' with a new controller, and returns the result wrapped by this controller's signal
 */
export function ApplyOnAbortCallback<TStrategy extends TAbortStrategy, TAborted extends TPromiseLikeConstraint<TAborted>>(
  instance: IAdvancedAbortSignal,
  options: IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted>,
): IPromiseNonConstrained<TAborted | TInferAbortStrategyReturn<TStrategy>> {
  if (typeof options.onAborted === 'function') {
    const newController: IAdvancedAbortController = options.onAbortedController as IAdvancedAbortController;
    return newController.signal.wrapPromise<unknown, TStrategy, never>(
      PromiseTry<unknown>(() => (options.onAborted as Function).call(instance, instance.reason, newController)),
      {
        strategy: options.strategy,
      }
    ) as IPromiseNonConstrained<TAborted | TInferAbortStrategyReturn<TStrategy>>;
  } else {
    return ApplyAbortStrategyUsingAdvancedAbortSignalReason<TStrategy>(instance, options.strategy) as IPromiseNonConstrained<TAborted | TInferAbortStrategyReturn<TStrategy>>;
  }
}

/**
 * Returns a Promise resolving as soon as 'promise' is resolved or 'instance' is aborted
 */
export function RaceAborted<T extends TPromiseLikeConstraint<T>>(
  instance: IAdvancedAbortSignal,
  promise: IPromiseLike<T>,
): IPromiseNonConstrained<T | void> {
  let observer: INotificationsObserver<'abort', void>;

  const p1 = $Promise.race([
    new $Promise<void>((resolve: any) => {
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
  ] as [
    IPromise<void>,
    IPromiseLike<T>,
  ]);

  return p1
    .then(...PromiseFinally<unknown>(() => {
      if (observer !== void 0) {
        observer.deactivate();
      }
    })) as IPromiseNonConstrained<T | void>;
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

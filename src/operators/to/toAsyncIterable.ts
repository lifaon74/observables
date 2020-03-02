import { IObservable } from '../../core/observable/interfaces';
import { Observer } from '../../core/observer/implementation';
import { IFiniteStateObservable } from '../../notifications/observables/finite-state/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IsObservable } from '../../core/observable/constructor';
import { KeyValueMapToNotifications } from '../../notifications/core/notifications-observable/types';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableFinalState,
  TFiniteStateObservableGeneric, TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode,
  TFiniteStateObservableModeConstraint
} from '../../notifications/observables/finite-state/types';
import { IsFiniteStateObservable } from '../../notifications/observables/finite-state/constructor';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { NormalizeAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/helpers';
import { IsObject } from '../../helpers';
import { TNativePromiseLikeOrValue } from '../../promises/types/native';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { INotification } from '../../notifications/core/notification/interfaces';

/** DEFINITIONS **/

/**
 * INFO:
 *  An Observable is a push source: it emits data without the need to pull them
 *  An Iterator is a pull source: it returns data when we pull (ask) them
 *
 *  To merge this different behaviours, a 'signal' (IAdvancedAbortSignal) SHOULD be provided when converting an Observable to an Iterable.
 *    -> when this signal is aborted, the iterator will end according to the provided 'strategy', and the observable will be released.
 */

export type TAbortObservableToAsyncIterableStrategy =
  'return' // ends the iterable by doing a simple return
  | 'throw'; // ends the iterable by throwing the abort reason

export type TInferAbortObservableToAsyncIterableStrategyReturn<TStrategy extends TAbortObservableToAsyncIterableStrategy> =
  TStrategy extends 'return'
    ? void
    : TStrategy extends 'throw'
    ? never
    : never;

export interface IObservableToAsyncIterableOptions<TStrategy extends TAbortObservableToAsyncIterableStrategy> {
  signal?: IAdvancedAbortSignal; // signal used to abort/stop the async iterable
  strategy?: TStrategy; // (default: 'return') how to end the iterable if signal is aborted
}

export interface IObservableToAsyncIterableNormalizedOptions<TStrategy extends TAbortObservableToAsyncIterableStrategy> extends Required<IObservableToAsyncIterableOptions<TStrategy>> {
}


/** NORMALIZE **/

export function NormalizeObservableToAsyncIterableOptionsSignal(signal?: IAdvancedAbortSignal): IAdvancedAbortSignal {
  return NormalizeAdvancedAbortSignal(signal);
}

export function NormalizeObservableToAsyncIterableOptionsStrategy<TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  strategy?: TStrategy,
  defaultValue: TAbortObservableToAsyncIterableStrategy = 'return'
): TStrategy {
  if (strategy === void 0) {
    return defaultValue as TStrategy;
  } else if (['return', 'throw'].includes(strategy)) {
    return strategy;
  } else {
    throw new TypeError(`Expected void, 'return' or 'throw' as options.strategy`);
  }
}


export function NormalizeObservableToAsyncIterableOptions<TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  options: IObservableToAsyncIterableOptions<TStrategy> = {},
): IObservableToAsyncIterableNormalizedOptions<TStrategy> {
  if (IsObject(options)) {
    return {
      ...options,
      signal: NormalizeObservableToAsyncIterableOptionsSignal(options.signal),
      strategy: NormalizeObservableToAsyncIterableOptionsStrategy<TStrategy>(options.strategy),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

/** CONVERT **/

/* INTERNAL HELPERS */

// represents a deferred promise
interface IDeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value?: TNativePromiseLikeOrValue<T>) => void;
  reject: (reason?: any) => void;
}

// creates a deferred promise
function CreateDeferredPromise<T>(): IDeferredPromise<T> {
  let resolve: (value?: TNativePromiseLikeOrValue<T>) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });


  return {
    promise,
    // @ts-ignore
    resolve,
    // @ts-ignore
    reject
  };
}

type TGenericObservableToStoppableAsyncIterableStopFunction<TStrategy extends TAbortObservableToAsyncIterableStrategy> = (strategy: TStrategy, reason?: any) => void;

interface TGenericObservableToStoppableAsyncIterableMapFunctionReturn<TValue, TStrategy extends TAbortObservableToAsyncIterableStrategy> {
  action?: 'skip' | 'yield' | TStrategy;
  reason?: any;
  value?: TValue;
}

type TGenericObservableToStoppableAsyncIterableMapValueFunction<TIn, TOut, TStrategy extends TAbortObservableToAsyncIterableStrategy> = (value: TIn) => TGenericObservableToStoppableAsyncIterableMapFunctionReturn<TOut, TStrategy>;

function DefaultMapValueFunction<TIn, TOut>(value: TIn): TOut {
  return value as unknown as TOut;
}

/**
 * Creates an AsyncIterable from an Observable
 */
async function * ObservableToStoppableAsyncIterable<TIn, TOut, TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IObservable<TIn>,
  mapValue: TGenericObservableToStoppableAsyncIterableMapValueFunction<TIn, TOut, TStrategy> = DefaultMapValueFunction,
  onStop?: (stop: TGenericObservableToStoppableAsyncIterableStopFunction<TStrategy>) => void, // optional callback which will receive a 'stop' callback to stop the iterable
): AsyncGenerator<TOut, void, undefined> {
  const values: TIn[] = [];
  let stopped: boolean = false;
  let stoppedStrategy: TStrategy = 'return' as TStrategy;
  let stoppedReason: any = void 0 as any;

  let deferred: IDeferredPromise<void> = CreateDeferredPromise<void>();

  const next = (value: TIn) => {
    values.push(value);
    deferred.resolve();
    deferred = CreateDeferredPromise<void>();
  };

  const observer: IObserver<TIn> = new Observer<TIn>((notification: TIn) => {
    next(notification);
  }).observe(observable);
  observer.activate();

  const stop = (strategy: TStrategy, reason?: any) => {
    stopped = true;
    stoppedStrategy = strategy;
    stoppedReason = reason;
    observer.deactivate();
    deferred.resolve();
  };

  if (onStop !== void 0) {
    onStop(stop);
  }

  while (true) {
    await deferred.promise;

    while ((values.length > 0) || stopped) {
      let result: TGenericObservableToStoppableAsyncIterableMapFunctionReturn<TOut, TStrategy> = void 0 as any;

      if (!stopped) {
        result = mapValue(values.shift() as TIn);
      }

      // separate in case 'mapValue' triggers a 'stop'
      if (stopped) {
        result = {
          action: stoppedStrategy,
          reason: stoppedReason,
        };
      }

      switch (result.action) {
        case 'skip':
          break;
        case 'yield':
          yield result.value as TOut;
          break;
        case 'return':
          if (!stopped) {
            stop('return' as TStrategy);
          }
          return;
        case 'throw':
          if (!stopped) {
            stop('throw' as TStrategy, result.reason);
          }
          throw result.reason;
        default:
          throw new Error(`Unexpected action: ${ result.action }`);
      }
    }
  }
}


function BuildObservableToStoppableAsyncIterableStopFunction<TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  signal: IAdvancedAbortSignal,
  strategy: TStrategy
) {
  return (stop: TGenericObservableToStoppableAsyncIterableStopFunction<TStrategy>): INotificationsObserver<any, any> | undefined => {
    if (signal.aborted) {
      stop(strategy, signal.reason);
      return void 0;
    } else {
      const signalObserver = signal.addListener('abort', (reason: any) => {
        signalObserver.deactivate();
        stop(strategy, reason);
      });
      signalObserver.activate();
      return signalObserver;
    }
  };
}

function BuildFiniteStateMapValueFunction<TNotification extends INotification<string, any>, TValue>(
  finished: () => void = () => {
  }
) {
  return (notification: TNotification): TGenericObservableToStoppableAsyncIterableMapFunctionReturn<TValue, TAbortObservableToAsyncIterableStrategy> => {
    switch (notification.name) {
      case 'next':
        return {
          action: 'yield',
          value: notification.value
        };
      case 'complete':
        finished();
        return {
          action: 'throw',
        };
      case 'error':
        finished();
        return {
          action: 'throw',
          reason: notification.value
        };
      default:
        return {
          action: 'skip'
        };
    }
  };
}

/* GENERIC */

function genericObservableToCancellableAsyncIterable<TValue, TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IObservable<TValue>,
  options: IObservableToAsyncIterableNormalizedOptions<TStrategy>
): AsyncGenerator<TValue, void, undefined> {
  return ObservableToStoppableAsyncIterable<TValue, TValue, TStrategy>(
    observable,
    undefined,
    BuildObservableToStoppableAsyncIterableStopFunction<TStrategy>(options.signal, options.strategy)
  );
}

function genericObservableToNonCancellableAsyncIterable<TValue>(
  observable: IObservable<TValue>
): AsyncGenerator<TValue, void, undefined> {
  return ObservableToStoppableAsyncIterable<TValue, TValue, never>(observable);
}

/**
 * Creates an AsyncIterator from an Observable
 *  - the iterator returns values received by 'observable'
 *  - you SHOULD provide an options.signal to abort the iterator (iterator will return void, or throw the reason depending on the strategy)
 */
export function genericObservableToAsyncIterable<TValue, TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IObservable<TValue>,
  options: IObservableToAsyncIterableOptions<TStrategy> = {}
): AsyncGenerator<TValue, void, undefined> {
  return ((options === void 0) || (options.signal === void 0))
    ? genericObservableToNonCancellableAsyncIterable<TValue>(observable)
    : genericObservableToCancellableAsyncIterable<TValue, TStrategy>(observable, NormalizeObservableToAsyncIterableOptions<TStrategy>(options));
}


/* FINITE STATE */

function finiteStateObservableToCancellableAsyncIterable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options: IObservableToAsyncIterableNormalizedOptions<TStrategy>
): AsyncGenerator<TValue, void, undefined> {
  type TNotification = KeyValueMapToNotifications<TKVMap>;
  let signalObserver: INotificationsObserver<any, any> | undefined;

  const clear = () => {
    if (signalObserver !== void 0) {
      signalObserver.deactivate();
    }
  };

  const onStop = BuildObservableToStoppableAsyncIterableStopFunction<TStrategy>(options.signal, options.strategy); // fix signal and options

  return ObservableToStoppableAsyncIterable<TNotification, TValue, TAbortObservableToAsyncIterableStrategy>(
    observable,
    BuildFiniteStateMapValueFunction<TNotification, TValue>(clear),
    (stop: TGenericObservableToStoppableAsyncIterableStopFunction<TAbortObservableToAsyncIterableStrategy>) => {
      signalObserver = onStop(stop);
    }
  );
}

function finiteStateObservableToNonCancellableAsyncIterable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
): AsyncGenerator<TValue, void, undefined> {
  type TNotification = KeyValueMapToNotifications<TKVMap>;
  return ObservableToStoppableAsyncIterable<TNotification, TValue, TAbortObservableToAsyncIterableStrategy>(
    observable,
    BuildFiniteStateMapValueFunction<TNotification, TValue>(),
  );
}

/**
 * Creates an AsyncIterator from an FiniteStateObservable
 *  - the iterator returns values received by 'next'
 *  - the iterator is done when a 'complete' is received
 *  - the iterator throws when a 'error' is received
 *  - you MAY provide an options.signal to abort the iterator (iterator will return void, or throw the reason depending on the strategy)
 */
export function finiteStateObservableToAsyncIterable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options: IObservableToAsyncIterableOptions<TStrategy> = {}
): AsyncGenerator<TValue, void, undefined> {
  return ((options === void 0) || (options.signal === void 0))
    ? finiteStateObservableToNonCancellableAsyncIterable<TValue, TFinalState, TMode, TKVMap>(observable)
    : finiteStateObservableToCancellableAsyncIterable<TValue, TFinalState, TMode, TKVMap, TStrategy>(observable, NormalizeObservableToAsyncIterableOptions<TStrategy>(options));
}

/**
 * Converts an Observable to an AsyncIterable
 *  -> calls proper conversion function depending on the Observable's type
 */
export function toAsyncIterable<TValue, TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: TFiniteStateObservableGeneric<TValue> | IObservable<TValue>,
  options?: IObservableToAsyncIterableOptions<TStrategy>
): AsyncGenerator<TValue> {
  if (IsFiniteStateObservable(observable)) {
    return finiteStateObservableToAsyncIterable<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>, TStrategy>(observable, options);
  } else if (IsObservable(observable)) {
    return genericObservableToAsyncIterable<TValue, TStrategy>(observable as IObservable<TValue>, options);
  } else {
    throw new TypeError(`Expected Observable as observable`);
  }
}

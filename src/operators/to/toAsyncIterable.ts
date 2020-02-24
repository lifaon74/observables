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
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { NormalizeAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/helpers';

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

export interface IObservableToAsyncIterableOptions<TStrategy> {
  signal?: IAdvancedAbortSignal; // signal used to abort/stop the async iterable
  strategy?: TStrategy; // (default: 'return')
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

/** CONVERT **/

/**
 * Creates an AsyncIterator which returns values received by 'observable'
 *  -> you may provide an options.signal to abort the iterator (iterator will return void, or throw the reason depending on the strategy)
 */
export async function * genericObservableToAsyncIterable<TValue, TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IObservable<TValue>,
  options: IObservableToAsyncIterableOptions<TStrategy> = {}
): AsyncGenerator<TValue> {
  const signal: IAdvancedAbortSignal = NormalizeObservableToAsyncIterableOptionsSignal(options.signal);
  const strategy: TStrategy = NormalizeObservableToAsyncIterableOptionsStrategy(options.strategy);

  const values: TValue[] = [];

  let resolve: () => void;
  let promise: Promise<void> = new Promise(_resolve => {
    resolve = _resolve;
  }); // used as breakpoint in the generator

  const next = (value: TValue) => {
    values.push(value);
    resolve();
    promise = new Promise(_resolve => {
      resolve = _resolve;
    });
  };

  const clear = () => {
    observer.deactivate();
    signalObserver.deactivate();
    resolve();
  };

  const signalObserver = signal.addListener('abort', () => {
    clear();
  });

  const observer: IObserver<TValue> = new Observer<TValue>((notification: TValue) => {
    next(notification);
  }).observe(observable);

  observer.activate();
  signalObserver.activate();

  while (true) {
    await promise;

    while ((values.length > 0) || signal.aborted) {
      if (signal.aborted) {
        switch (strategy) {
          case 'return':
            return;
          case 'throw':
            throw signal.reason;
          default:
            throw new Error(`Unexpected strategy: ${ strategy }`);
        }
      } else {
        yield values.shift() as TValue;
      }
    }
  }
}

/**
 * Just like genericObservableToAsyncIterable, but this iterable will automatically end when the finiteStateObservable is finished
 */
export async function * finiteStateObservableToAsyncIterable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>,
  TStrategy extends TAbortObservableToAsyncIterableStrategy>(
  observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  options: IObservableToAsyncIterableOptions<TStrategy> = {}
): AsyncGenerator<TValue> {
  const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(options.signal);
  const strategy: TStrategy = NormalizeObservableToAsyncIterableOptionsStrategy(options.strategy);

  const _options: IObservableToAsyncIterableOptions<'return'> = {
    ...options,
    signal: controller.signal,
    strategy: 'return',
  };

  const iterator: AsyncIterator<KeyValueMapToNotifications<TKVMap>> = genericObservableToAsyncIterable(observable, _options);
  let result: IteratorResult<KeyValueMapToNotifications<TKVMap>>;
  while (!(result = await iterator.next()).done) {
    const notification: KeyValueMapToNotifications<TKVMap> = result.value;
    switch (notification.name) {
      case 'next':
        yield notification.value;
        break;
      case 'complete':
        controller.abort('complete');
        return;
      case 'error':
        controller.abort('error');
        throw notification.value;
      case 'abort':
        controller.abort('abort');
        switch (strategy) {
          case 'return':
            return;
          case 'throw':
            throw notification.value;
          default:
            throw new Error(`Unexpected strategy: ${ strategy }`);
        }
    }
  }
}


/**
 * Converts an Observable to an Iterable
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

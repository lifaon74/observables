import { IFiniteStateObservable } from '../../../interfaces';
import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableGeneric, TFiniteStateObservableModeConstraint
} from '../../../types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';
import { IObserver } from '../../../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../../helpers';

export function GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInParallel<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  observables: Iterable<IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>>
): TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap> {
  type TObservable = IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
  type TObserver = IObserver<KeyValueMapToNotifications<TKVMap>>;
  type TContext = IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>;
  // type TObservable = TFiniteStateObservableGeneric<TValue>;
  // type TObserver = TFiniteStateObserverGeneric<TValue>;

  let context: TContext;

  const _observables: readonly TObservable[] = Array.from(observables);
  const observablesLength: number = _observables.length;
  if (observablesLength < 2) {
    throw new Error(`Expected at least 2 observables`);
  }

  let pendingObservers: number = observablesLength;
  const observers: TObserver[] = _observables.map((observable: TObservable) => {
    return [
      (observable as unknown as TFiniteStateObservableGeneric<TValue>)
        .addListener('next', (value: TValue) => {
          context.next(value);
        }),

      (observable as unknown as TFiniteStateObservableGeneric<TValue>)
        .addListener('complete', () => {
          pendingObservers--;
          if (pendingObservers <= 0) {
            clear();
            context.complete();
          }
        }),

      (observable as unknown as TFiniteStateObservableGeneric<TValue>)
        .addListener('error', (error: any) => {
          clear();
          context.error(error);
        }),
    ] as unknown as TObserver[];
  }).flat();

  const clear = () => {
    observers.forEach((observer: TObserver) => observer.deactivate());
  };

  return function (_context: TContext) {
    context = _context;
    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
        if (
          (instance.observers.length === 1)
          && (instance.state === 'next')
        ) {
          observers.forEach((observer: TObserver) => observer.activate());
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, clear);
      },
    };
  };
}

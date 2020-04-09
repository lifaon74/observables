import { IFiniteStateObservable } from '../../../interfaces';
import {
  TFiniteStateObservableCreateCallback, TFiniteStateObservableFinalState, TFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableMode
} from '../../../types';
import { IFiniteStateObservableContext } from '../../../context/interfaces';
import { IObserver } from '../../../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import { FiniteStateObservableHookDefaultOnUnobserved } from '../../../helpers';
import { TRunSequentialFiniteStateObservablesObservables } from './types';

export function GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInSequence<TValue>(
  observables: TRunSequentialFiniteStateObservablesObservables<TValue>,
): TFiniteStateObservableCreateCallback<TValue, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>> {
  type TFinalState = TFiniteStateObservableFinalState;
  type TMode = string;
  type TKVMap = TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;

  type TObservable = IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
  type TObserver = IObserver<KeyValueMapToNotifications<TKVMap>>;
  type TContext = IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>;

  let context: TContext;
  const observablesIterator: Iterator<TObservable, any, TValue> = observables[Symbol.iterator]();

  // let index: number = 0;
  // const observers: TObserver[][] = _observables.map((observable: TObservable) => {
  //   return [
  //     (observable as unknown as TFiniteStateObservableGeneric<TValue>)
  //       .addListener('next', (value: TValue) => {
  //         context.next(value);
  //       }),
  //
  //     (observable as unknown as TFiniteStateObservableGeneric<TValue>)
  //       .addListener('complete', () => {
  //         deactivateAllObserver();
  //         index++;
  //
  //         if (index >= observablesLength) {
  //           context.complete();
  //         } else {
  //           activateAllObserver();
  //         }
  //       }),
  //
  //     (observable as unknown as TFiniteStateObservableGeneric<TValue>)
  //       .addListener('error', (error: any) => {
  //         deactivateAllObserver();
  //         context.error(error);
  //       }),
  //   ] as unknown as TObserver[];
  // });

  const next = (...args: [] | [TValue]) => {
    const result: IteratorResult<TObservable> = observablesIterator.next(...args);
    if (result.done) {
      context.complete();
    }
  };

  const activateAllObserver = () => {
    // observers[index].forEach((observer: TObserver) => observer.activate());
  };

  const deactivateAllObserver = () => {
    // observers[index].forEach((observer: TObserver) => observer.deactivate());
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
          activateAllObserver();
        }
      },
      onUnobserved(): void {
        FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, deactivateAllObserver);
      },
    };
  };
}


// export function GenerateFiniteStateObservableHookFromFileFiniteStateObservablesInSequence<TValue,
//   TFinalState extends TFinalStateConstraint<TFinalState>,
//   TMode extends TFiniteStateObservableModeConstraint<TMode>,
//   TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
//   observables: Iterable<IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>>
// ): TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap> {
//   type TObservable = IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
//   type TObserver = IObserver<KeyValueMapToNotifications<TKVMap>>;
//   type TContext = IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>;
//   // type TObservable = TFiniteStateObservableGeneric<TValue>;
//   // type TObserver = TFiniteStateObserverGeneric<TValue>;
//
//   let context: TContext;
//
//   const _observables: readonly TObservable[] = Array.from(observables);
//   const observablesLength: number = _observables.length;
//   if (observablesLength < 2) {
//     throw new Error(`Expected at least 2 observables`);
//   }
//
//   let index: number = 0;
//   const observers: TObserver[][] = _observables.map((observable: TObservable) => {
//     return [
//       (observable as unknown as TFiniteStateObservableGeneric<TValue>)
//         .addListener('next', (value: TValue) => {
//           context.next(value);
//         }),
//
//       (observable as unknown as TFiniteStateObservableGeneric<TValue>)
//         .addListener('complete', () => {
//           deactivateAllObserver();
//           index++;
//
//           if (index >= observablesLength) {
//             context.complete();
//           } else {
//             activateAllObserver();
//           }
//         }),
//
//       (observable as unknown as TFiniteStateObservableGeneric<TValue>)
//         .addListener('error', (error: any) => {
//           deactivateAllObserver();
//           context.error(error);
//         }),
//     ] as unknown as TObserver[];
//   });
//
//
//   const activateAllObserver = () => {
//     observers[index].forEach((observer: TObserver) => observer.activate());
//   };
//
//   const deactivateAllObserver = () => {
//     observers[index].forEach((observer: TObserver) => observer.deactivate());
//   };
//
//   return function (_context: TContext) {
//     context = _context;
//     return {
//       onObserved(): void {
//         const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
//         if (
//           (instance.observers.length === 1)
//           && (instance.state === 'next')
//         ) {
//           activateAllObserver();
//         }
//       },
//       onUnobserved(): void {
//         FiniteStateObservableHookDefaultOnUnobserved<TValue, TFinalState, TMode, TKVMap>(this as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, context, deactivateAllObserver);
//       },
//     };
//   };
// }



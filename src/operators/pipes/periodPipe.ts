import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * ObservableObserver:
 *  - when a value is received:
 *    - if its the first value since "period" time => immediately emits the value, then for all following received value for "period" time, cache the last one
 *    - else => cache the last received value, and emits it at the end of "period"
 *
 * As result, a value is emitted evey 'period' ms at the best, and the last emitted value if always transmitted.
 */
export function periodDynamicPipe<T>(period: (value: T) => number): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    let timer: any | null = null;
    let previousValue: T;
    let hasValue: boolean = false;

    const onEmit = (value: T): void => {
      if (timer === null) {
        context.emit(value);
        hasValue = false;
        timer = setTimeout(() => {
          timer = null;
          if (hasValue) {
            onEmit(previousValue);
          }
        }, period(value));
      } else {
        hasValue = true;
        previousValue = value;
      }
    };

    return {
      onEmit: onEmit
    };
  });
}

export function periodPipe<T>(period: number): IPipe<IObserver<T>, IObservable<T>> {
  return periodDynamicPipe<T>(() => period);
}

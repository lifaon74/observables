import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver: delays the emission of the values.
 *  - when a value is received, the pipe transmits this value after "period" milliseconds
 * @param period
 */
export function delayDynamicPipe<T>(period: (value: T) => number): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        setTimeout(() => {
          context.emit(value);
        }, period(value));
      }
    };
  });
}


export function delayPipe<T>(period: number): IPipe<IObserver<T>, IObservable<T>> {
  return delayDynamicPipe<T>(() => period);
}

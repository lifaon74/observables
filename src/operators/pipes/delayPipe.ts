import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

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

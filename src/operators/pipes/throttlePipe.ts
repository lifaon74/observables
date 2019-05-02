import {IPipe, TPipeContextBase} from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * ObservableObserver: emits a value, then ignores subsequent source values for a duration determined by 'period'
 *  - when a value is received, the pipe transmits it and discards all following receives values for 'period' milliseconds
 * @param period
 */
export function throttleDynamicPipe<T>(period: (value: T) => number): IPipe<IObserver<T>, IObservable<T>> {
  let timer: any | null = null;
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (timer === null) {
          context.emit(value);
          timer = setTimeout(() => {
            timer = null;
          }, period(value));
        }
      }
    };
  });
}


export function throttlePipe<T>(period: number): IPipe<IObserver<T>, IObservable<T>> {
  return throttleDynamicPipe<T>(() => period);
}

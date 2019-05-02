import {IPipe, TPipeContextBase} from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * ObservableObserver: emits a value only after a particular time span determined by the function 'period' has passed without another source emission.
 *  - when a value is received, cancel last timer, wait "period" milliseconds as timer and emits the value
 * @param period
 */
export function debounceDynamicPipe<T>(period: (value: T) => number): IPipe<IObserver<T>, IObservable<T>> {
  let timer: any | null = null;
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          timer = null;
          context.emit(value);
        }, period(value));
      }
    };
  });
}


export function debouncePipe<T>(period: number): IPipe<IObserver<T>, IObservable<T>> {
  return debounceDynamicPipe<T>(() => period);
}

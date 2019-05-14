import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe transmits it only if `filter(value)` returns true
 * @param filter
 */
export function filterPipe<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (filter(value)) {
          context.emit(value);
        }
      }
    };
  });
}

import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

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

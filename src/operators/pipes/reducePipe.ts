import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe calls the reducer function and emits the result
 * @param reducer
 * @param previousValue
 */
export function reducePipe<T>(reducer: (previousValue: T, value: T) => T, previousValue: T): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        previousValue = reducer(previousValue, value);
        context.emit(previousValue);
      }
    };
  });
}

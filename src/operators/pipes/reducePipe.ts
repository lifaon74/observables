import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

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

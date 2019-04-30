import {IPipe, TPipeContextBase} from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * Creates an ObservableObserver emitting only distinct values coming from its observer.
 * @param previousValue
 */
export function distinctPipe<T>(previousValue: T | undefined = void 0): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (value !== previousValue) {
          previousValue = value;
          context.emit(value);
        }
      }
    };
  });
}

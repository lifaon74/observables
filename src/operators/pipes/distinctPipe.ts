import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe transmits it only if the value is different than the previous one (meaning all emitted values are distinct)
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

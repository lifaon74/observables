import {IPipe, TPipeContextBase} from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * ObservableObserver:
 *  - when a array of values is received, the pipe iterates over this array and transmits each value individually
 */
export function flattenPipe<T>(): IPipe<IObserver<T[]>, IObservable<T>> {
  return Pipe.create<T[], T>((context: TPipeContextBase<T[], T>) => {
    return {
      onEmit(values: T[]): void {
        for (const value of values) {
          context.emit(value);
        }
      }
    };
  });
}

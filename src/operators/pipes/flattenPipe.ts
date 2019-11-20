import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

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

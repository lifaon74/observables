import { IPipe, IPipeContext } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * Creates an ObservableObserver which filters the values it receives though "filter"
 * @param filter
 */
export function filterPipe<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: IPipeContext<T, T>) => {
    return {
      onEmit(value: T): void {
        if (filter(value)) {
          context.emit(value);
        }
      }
    };
  });
}

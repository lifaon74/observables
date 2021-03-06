import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe logs it and then transmits it
 * @param name
 */
export function logPipe<T>(name?: string): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (name) {
          console.log('%c' + name, 'color: #006f23', value);
        } else {
          console.log(value);
        }
        context.emit(value);
      }
    };
  });
}

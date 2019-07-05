import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';

/**
 * ObservableObserver: caches incoming values to be able to emits them to future observers
 *  - when a value is received, the pipe caches the value and transmits it
 *  - when a new observer observes this pipe, the pipe emits the last cached values
 * @param cacheSize
 */
export function cachePipe<T>(cacheSize: number = 128): IPipe<IObserver<T>, IObservable<T>> {

  const cachedValues: T[] = new Array(cacheSize);
  let writeIndex: number = 0;
  const readIndexes: WeakMap<IObserver<T>, number> = new WeakMap<IObserver<T>, number>();

  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        cachedValues[writeIndex % cacheSize] = value;
        writeIndex++;

        context.emit(value);

        for (let i = 0, l = context.pipe.observable.observers.length; i < l; i++) {
          readIndexes.set(context.pipe.observable.observers.item(i), writeIndex);
        }
      },
      onObserved(observer: IObserver<T>): void {
        const index: number = Math.max(
          readIndexes.has(observer) ? readIndexes.get(observer) as number : 0,
          writeIndex - cacheSize
        );
        if (index < writeIndex) {
          for (let i = index; i < writeIndex; i++) {
            observer.emit(cachedValues[i % cacheSize]);
          }
          readIndexes.set(observer, writeIndex);
        }
      }
    };
  });
}

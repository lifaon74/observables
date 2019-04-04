import { IObservable, IObservableContext } from '../core/observable/interfaces';
import { Observable, ObservableClearObservers } from '../core/observable/implementation';
import { IOnObservableCompleteOptions, NormalizeOnObservableCompleteAction } from './helpers';

export interface IFromOptions extends IOnObservableCompleteOptions {
}

export function from<T>(iterable: Iterable<T>, options: IFromOptions = {}): IObservable<T> {
  const _options: IFromOptions = {
    onComplete: NormalizeOnObservableCompleteAction(options.onComplete),
  };

  return new Observable<T>((context: IObservableContext<T>) => {
    let complete: boolean = false;
    return {
      onObserved(): void {
        if (complete && (_options.onComplete === 'clear-strict')) {
          throw new Error(`Cannot observe this Observable, because it is complete.`);
        } else {
          const iterator: Iterator<T> = iterable[Symbol.iterator]();
          let result: IteratorResult<T>;
          while (!(result = iterator.next()).done) {
            context.emit(result.value);
          }
          complete = true;

          if ((_options.onComplete === 'clear') || (_options.onComplete === 'clear-strict')) {
            setTimeout(() => {
              ObservableClearObservers<T>(context.observable);
            }, 0);
          }
        }
      }
    };
  });
}
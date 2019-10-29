import { IObservable } from '../../core/observable/interfaces';
import { IObserver } from '../../core/observer/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe transforms this value with  "transform" and emits the result.
 * @param transform
 */
export function mapPipe<Tin, Tout>(transform: (value: Tin) => Tout): IPipe<IObserver<Tin>, IObservable<Tout>> {
  return Pipe.create<Tin, Tout>((context: TPipeContextBase<Tin, Tout>) => {
    return {
      onEmit(value: Tin): void {
        context.emit(transform(value));
      }
    };
  });
}

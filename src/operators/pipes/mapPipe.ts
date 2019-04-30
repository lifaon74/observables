import { IPipe, TPipeContextBase } from '../../core/observable-observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { IObserver } from '../../core/observer/interfaces';

/**
 * Creates an ObservableObserver which maps the values it receives from the type Tin to Tout though "transform"
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

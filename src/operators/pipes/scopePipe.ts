import { IObserver } from '../../core/observer/interfaces';
import { IObservable } from '../../core/observable/interfaces';
import { mapPipe } from './mapPipe';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TupleUnshift } from '@lifaon/class-factory';

/**
 * ObservableObserver:
 *  - when a value is received, the pipe emits an array composed of this value and args: [value, ...args]
 */
export function scopePipe<Tin, TArgs extends any[]>(...args: TArgs): IPipe<IObserver<Tin>, IObservable<TupleUnshift<TArgs, Tin>>> {
  return mapPipe<Tin, TupleUnshift<TArgs, Tin>>((value: Tin) => {
    return [value, ...args] as TupleUnshift<TArgs, Tin>;
  });
}


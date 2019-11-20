import { IObserver } from '../../../core/observer/interfaces';
import { TupleUnshift } from '../../../classes/types';
import { scopePipe } from '../../pipes/scopePipe';

/**
 * Values received by the returned Observer, are concatenated with 'args' and emitted into the input 'observer'
 *  - for each value emitted by the returned Observer, 'observer' will receive [value, ...args]
 */
export function $scope<Tin, TArgs extends any[]>(observer: IObserver<TupleUnshift<TArgs, Tin>>, ...args: TArgs): IObserver<Tin> {
  const pipe = scopePipe<Tin, TArgs>(...args);
  pipe.observable.observedBy(observer);
  return pipe.observer;
}

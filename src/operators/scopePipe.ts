import { IPipe } from '../core/observable-observer/interfaces';
import { IObserver } from '../core/observer/interfaces';
import { IObservable } from '../core/observable/interfaces';
import { mapPipe } from './pipes/mapPipe';
import { TupleUnshift } from '../classes/types';


export function scopePipe<Tin, TArgs extends any[]>(...args: TArgs): IPipe<IObserver<Tin>, IObservable<TupleUnshift<TArgs, Tin>>> {
// export function scopePipe<Tin, Tout extends [Tin, ...any[]]>(...args: any[]): IPipe<IObserver<Tin>, IObservable<Tout>> {
  return mapPipe<Tin, TupleUnshift<TArgs, Tin>>((value: Tin) => {
    return [value, ...args] as TupleUnshift<TArgs, Tin>;
  });
}


export function $scope<Tin, TArgs extends any[]>(observer: IObserver<TupleUnshift<TArgs, Tin>>, ...args: TArgs): IObserver<Tin> {
// export function $scope<Tin, Tout extends [Tin, ...any[]]>(observer: IObserver<Tout>, ...args: any[]): IObserver<Tin> {
  const pipe = scopePipe<Tin, TArgs>(...args);
  pipe.observable.observedBy(observer);
  return pipe.observer;
}

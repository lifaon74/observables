import { IPipe } from '../core/observable-observer/interfaces';
import { IObserver } from '../core/observer/interfaces';
import { IObservable } from '../core/observable/interfaces';
import { mapPipe } from './pipes/mapPipe';

// export function scope<Tin, TArgs extends any[]>(...args: TArgs): IPipe<IObserver<Tin>, IObservable<[Tin, ...TArgs]>> {
export function scopePipe<Tin, Tout extends [Tin, ...any[]]>(...args: any[]): IPipe<IObserver<Tin>, IObservable<Tout>> {
  return mapPipe<Tin, Tout>((value: Tin) => {
    return [value, ...args] as Tout;
  });
}


export function $scope<Tin, Tout extends [Tin, ...any[]]>(observer: IObserver<Tout>, ...args: any[]): IObserver<Tin> {
  const pipe = scopePipe<Tin, Tout>(...args);
  pipe.observable.observedBy(observer);
  return pipe.observer;
}

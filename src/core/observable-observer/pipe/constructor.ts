import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { IObservableObserver } from '../interfaces';
import { IPipeInternal, IPipePrivate, PIPE_PRIVATE } from './privates';
import { IsObject } from '../../../helpers';
import { OBSERVER_PRIVATE } from '../../observer/privates';
import { IObservableInternal, IObservablePrivate, OBSERVABLE_PRIVATE } from '../../observable/privates';
import { ObservableType } from '../../observable/types';
import { IPipe } from './interfaces';
import { PipeUpdateAutoActivate, PipeUpdateAutoDeactivate } from './functions';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(
  instance: IPipe<TObserver, TObservable>,
  create: () => IObservableObserver<TObserver, TObservable>
): void {
  ConstructClassWithPrivateMembers(instance, PIPE_PRIVATE);
  const privates: IPipePrivate<TObserver, TObservable> = (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE];
  privates.autoActivate = true;
  privates.autoDeactivate = true;

  if (typeof create === 'function') {
    const result: IObservableObserver<TObserver, TObservable> = create.call(instance);

    if (IsObject(result)) {

      if (result.observer.hasOwnProperty(OBSERVER_PRIVATE)) {
        privates.observer = result.observer;
      } else {
        throw new TypeError(`Expected property observer of type Observer in return of Pipe's create function`);
      }

      if (result.observable.hasOwnProperty(OBSERVABLE_PRIVATE)) {
        privates.observable = result.observable;
        type TDistinctValueObservable = ObservableType<TObservable>;
        const observablePrivates: IObservablePrivate<TDistinctValueObservable> = ((privates.observable as IObservable<TDistinctValueObservable>) as IObservableInternal<TDistinctValueObservable>)[OBSERVABLE_PRIVATE];

        const _onObserveHook = observablePrivates.onObserveHook;
        observablePrivates.onObserveHook = function onObserveHook(observer: IObserver<TDistinctValueObservable>) {
          PipeUpdateAutoActivate<TObserver, TObservable>(instance);
          _onObserveHook.call(this, observer);
        };

        const _onUnobserveHook = observablePrivates.onUnobserveHook;
        observablePrivates.onUnobserveHook = function onUnobserveHook(observer: IObserver<TDistinctValueObservable>) {
          PipeUpdateAutoDeactivate<TObserver, TObservable>(instance);
          _onUnobserveHook.call(this, observer);
        };
      } else {
        throw new TypeError(`Expected property observable of type Observable in return of Pipe's create function`);
      }
    } else {
      throw new TypeError(`Expected { observable, observer } as return of Pipe's create function.`);
    }
  } else {
    throw new TypeError(`Expected function as Pipe's create function.`);
  }
}

export function IsPipe(value: any): value is IPipe<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(PIPE_PRIVATE as symbol);
}

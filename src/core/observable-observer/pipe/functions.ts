import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { IPipe } from './interfaces';
import { IPipeInternal, IPipePrivate, PIPE_PRIVATE } from './privates';
import { IObserverInternal, OBSERVER_PRIVATE } from '../../observer/privates';
import { ObserverType } from '../../observer/types';
import { IObservableInternal, OBSERVABLE_PRIVATE } from '../../observable/privates';
import { ObservableType } from '../../observable/types';
import { ObserverActivate, ObserverDeactivate } from '../../observer/implementation';


/** FUNCTIONS **/

export function PipeSetAutoActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, value: boolean): void {
  const privates: IPipePrivate<TObserver, TObservable> = (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE];
  if (value !== privates.autoActivate) {
    privates.autoActivate = value;
    PipeUpdateAutoActivate<TObserver, TObservable>(instance);
  }
}

export function PipeSetAutoDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>, value: boolean): void {
  const privates: IPipePrivate<TObserver, TObservable> = (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE];
  if (value !== privates.autoDeactivate) {
    privates.autoDeactivate = value;
    PipeUpdateAutoDeactivate<TObserver, TObservable>(instance);
  }
}

export function PipeUpdateAutoActivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): void {
  const privates: IPipePrivate<TObserver, TObservable> = (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE];
  if (
    privates.autoActivate
    && !((privates.observer as unknown) as IObserverInternal<ObserverType<TObserver>>)[OBSERVER_PRIVATE].activated
    // && ObservableIsObserved<ObservableType<TObservable>>(privates.observable)
    && (((privates.observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length > 0)
  ) {
    ObserverActivate<ObserverType<TObserver>>(instance.observer);
  }
}

export function PipeUpdateAutoDeactivate<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(instance: IPipe<TObserver, TObservable>): void {
  const privates: IPipePrivate<TObserver, TObservable> = (instance as IPipeInternal<TObserver, TObservable>)[PIPE_PRIVATE];
  if (
    privates.autoDeactivate
    && ((privates.observer as unknown) as IObserverInternal<ObserverType<TObserver>>)[OBSERVER_PRIVATE].activated
    && (((privates.observable as unknown) as IObservableInternal<ObservableType<TObservable>>)[OBSERVABLE_PRIVATE].observers.length === 0)
  ) {
    ObserverDeactivate<ObserverType<TObserver>>(instance.observer);
  }
}

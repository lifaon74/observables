import { IObserver } from './interfaces';
import { IObservable } from '../observable/interfaces';
import { IObserverInternal, IObserverPrivate, OBSERVER_PRIVATE } from './privates';
import { IsObject } from '../../helpers';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructObserver<T>(instance: IObserver<T>, onEmit: (value: T, observable?: IObservable<T>) => void): void {
  ConstructClassWithPrivateMembers(instance, OBSERVER_PRIVATE);
  const privates: IObserverPrivate<T> = (instance as IObserverInternal<T>)[OBSERVER_PRIVATE];
  privates.activated = false;
  privates.observables = [];

  if (typeof onEmit === 'function') {
    privates.onEmit = onEmit.bind(instance);
  } else {
    throw new TypeError(`Expected function as first argument of Observer.`);
  }
}

/**
 * Returns true if 'value' is an Observer
 */
export function IsObserver<G>(value: any): value is IObserver<G> {
  return IsObject(value)
    && value.hasOwnProperty(OBSERVER_PRIVATE as symbol);
}

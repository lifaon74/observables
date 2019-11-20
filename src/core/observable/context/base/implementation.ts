import { IObservableContextBase } from './interfaces';
import { IObservable } from '../../interfaces';
import { ConstructObservableContextBase } from './constructor';
import { IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE } from './privates';

/** METHODS **/

/* GETTERS/SETTERS */

export function ObservableContextBaseGetObservable<T>(instance: IObservableContextBase<T>): IObservable<T> {
  return (instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable;
}

/** ABSTRACT CLASS **/

export abstract class ObservableContextBase<T> implements IObservableContextBase<T> {

  protected constructor(observable: IObservable<T>) {
    ConstructObservableContextBase<T>(this, observable);
  }

  get observable(): IObservable<T> {
    return ObservableContextBaseGetObservable<T>(this);
  }

  abstract emit(...args: any[]): any;
}

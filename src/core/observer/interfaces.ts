import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObservable } from '../observable/interfaces';
import { TObserverObserveResultNonCyclic } from './types';
import { IActivable, IActivableLike } from '../../misc/activable/interfaces';


/** INTERFACES **/

export interface IObserverConstructor {
  new<T>(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

export interface IObserverTypedConstructor<T> {
  new(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

/**
 * A Observer is a push destination: it receives data though 'emit'
 */
export interface IObserver<T> extends IActivableLike {
  // true if Observer is activated
  readonly activated: boolean;
  // list of Observables observed by this Observer
  readonly observables: IReadonlyList<IObservable<T>>;
  // true if Observer is observing at least one Observable
  readonly observing: boolean;

  // emit a value
  emit(value: T, observable?: IObservable<T>): void;

  // activates the Observer
  activate(): this;

  // deactivates the Observer
  deactivate(): this

  toggle(activate?: boolean): this;

  // observes a list of Observables
  observe<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this

  // stops observing a list of Observables
  unobserve<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this

  // stops observing all its Observables
  disconnect(): this;
}



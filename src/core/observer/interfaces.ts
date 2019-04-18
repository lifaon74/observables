import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObservable } from '../observable/interfaces';
import { IsSubSet, TupleTypes, UnionToIntersection } from '../../classes/types';

/** TYPES **/

// for a list of Observers, if each Observer supports the types of an Observable, returns the Observable, else returns never
export type TObserverObserveResult<TObservables extends IObservable<any>[], TObserver extends IObserver<any>> = TObserver extends IObserver<infer TReferenceObservableValue>
  ? (
    boolean extends TupleTypes<{
      [key in keyof TObservables]: TObservables[key] extends IObservable<infer T>
        ? UnionToIntersection<TReferenceObservableValue> extends UnionToIntersection<T>
          ? string
          : boolean
        : boolean
    }> ? never : TObserver
    ) : never;


export type TObserverObserveResultNonCyclic<TObservables extends IObservable<any>[], TReferenceObservableValue, TReturn> =
  false extends TupleTypes<{
    [key in keyof TObservables]: TObservables[key] extends IObservable<infer T>
      ? IsSubSet<T, TReferenceObservableValue>
      : false
  }> ? never : TReturn;


export type TObserverUnObserveResult<TObservables extends IObservable<any>[], TObserver extends IObserver<any>> = TObserverObserveResult<TObservables, TObserver>;
export type TObserverUnObserveResultNonCyclic<TObservables extends IObservable<any>[], TReferenceObservableValue, TReturn> =TObserverObserveResultNonCyclic<TObservables, TReferenceObservableValue, TReturn>;

export type TObserverConstructorArgs<T> = [(value: T, observable?: IObservable<T>) => void];

// returns the type of an Observer
export type ObserverType<T extends IObserver<any>> = T extends IObserver<infer R> ? R : never;

/** INTERFACES **/

export interface IObserverConstructor {
  // creates an Observer
  new<T>(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

export interface IObserverTypedConstructor<T> {
  new(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

/**
 * A Observer is a push destination: it receives data though 'emit'
 */
export interface IObserver<T> {
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


  // observes a list of Observables
  observe<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>;

  // stops observing a list of Observables
  unobserve<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>;

  // stops observing all its Observables
  disconnect(): this;
}



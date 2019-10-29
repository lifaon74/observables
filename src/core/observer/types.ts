import { IObservable } from '../observable/interfaces';
import { IsSubSet, TupleTypes, UnionToIntersection } from '../../classes/types';
import { IObserver } from './interfaces';

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

export type TObserverUnObserveResultNonCyclic<TObservables extends IObservable<any>[], TReferenceObservableValue, TReturn> = TObserverObserveResultNonCyclic<TObservables, TReferenceObservableValue, TReturn>;

export type TObserverConstructorArgs<T> = [(value: T, observable?: IObservable<T>) => void];

// returns the type of an Observer
export type ObserverType<T extends IObserver<any>> = T extends IObserver<infer R> ? R : never;

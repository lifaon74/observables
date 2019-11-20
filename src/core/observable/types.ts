import { IObservableContext } from './context/interfaces';
import { IObservableHook } from './hook/interfaces';
import { IObservableObserver } from '../observable-observer/interfaces';
import { IObserver } from '../observer/interfaces';
import { IsSubSet, TupleTypes, UnionToIntersection } from '../../classes/types';
import { IObservable } from './interfaces';

/** TYPES **/

type SuperSet<T, U> = {
  [key in keyof T]: key extends keyof U
    ? (U[key] extends T[key] ? T[key] : U[key])
    : T[key]
};

// if an Observer supports the types of an Observable, returns the Observer, else returns never
export type TObservablePipeToObserverResult<TInputObserver extends IObserver<any>, TReferenceObserverValue> =
  TInputObserver extends IObserver<infer T>
    ? IsSubSet<TReferenceObserverValue, T> extends true
    ? TInputObserver
    : never
    : never;

// if an Observer's callback supports the types of an Observable, returns an Observer composed with this callback, else returns never
export type TObservablePipeToCallbackResult<TInputCallback extends (value: any) => void, TReferenceObserverValue> =
  TInputCallback extends () => void
    ? IObserver<void>
    : TInputCallback extends (value: infer T) => void
    ? IsSubSet<TReferenceObserverValue, T> extends true
      ? IObserver<T>
      : never
    : never;

// if an ObservableObserver's Observer supports the types of an Observable, returns the ObservableObserver's Observable, else returns never
export type TObservablePipeThroughResult<TInputObservableObserver extends IObservableObserver<IObserver<any>, IObservable<any>>, TReferenceObserverValue> =
  TInputObservableObserver extends IObservableObserver<IObserver<infer T>, infer TObservable>
    ? IsSubSet<TReferenceObserverValue, T> extends true
    ? TObservable
    : never
    : never;

// if an ObservableObserver's Observer supports the types of an Observable, returns the ObservableObserver, else returns never
export type TObservablePipeResult<TInputObservableObserver extends IObservableObserver<IObserver<any>, IObservable<any>>, TReferenceObserverValue> =
  TInputObservableObserver extends IObservableObserver<IObserver<infer T>, IObservable<any>>
    ? IsSubSet<TReferenceObserverValue, T> extends true
    ? TInputObservableObserver
    : never
    : never;


// for a list of Observers, if each Observer supports the types of an Observable, returns the Observable, else returns never
export type TObservableObservedByResult<TObservers extends TObserverOrCallback<any>[], TObservable extends IObservable<any>> = TObservable extends IObservable<infer TReferenceObserverValue>
  ? (
    boolean extends TupleTypes<{
      [key in keyof TObservers]: TObservers[key] extends IObserver<infer T>
        ? UnionToIntersection<T> extends UnionToIntersection<TReferenceObserverValue>
          ? string
          : boolean
        : TObservers[key] extends (value: infer T) => void
          ? UnionToIntersection<T> extends UnionToIntersection<TReferenceObserverValue>
            ? string
            : boolean
          : boolean
    }> ? never : TObservable
    ) : never;

// export type TObservableObservedByResultNonCyclic<TObservers extends TObserverOrCallback<any>[], TReferenceObserverValue, TReturn> =
//   false extends TupleTypes<{
//     [key in keyof TObservers]: TObservers[key] extends IObserver<infer T>
//       ? IsSubSet<TReferenceObserverValue, T>
//       : TObservers[key] extends (value: infer T) => void
//         ? IsSubSet<TReferenceObserverValue, T>
//         : false
//   }> ? never : TReturn;

export type TObservableObservedByResultNonCyclic<TObservers extends TObserverOrCallback<any>[], TReferenceObserverValue, TReturn> =
  false extends {
    [key in keyof TObservers]: TObservers[key] extends IObserver<infer T>
      ? IsSubSet<TReferenceObserverValue, T>
      : TObservers[key] extends (value: infer T) => void
        ? IsSubSet<TReferenceObserverValue, T>
        : false
  }[keyof TObservers] ? never : TReturn;

export type TObservableConstructorArgs<T> = [(((context: IObservableContext<T>) => (IObservableHook<T> | void)))?];

// returns the type of an Observable
export type ObservableType<T extends IObservable<any>> = T extends IObservable<infer R> ? R : never;

export type TObserverOrCallback<T> = IObserver<T> | ((value: T) => void);

import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserver } from '../observer/interfaces';
import { IObservableObserver } from '../observable-observer/interfaces';
import { IsSubSet, TupleTypes, UnionToIntersection } from '../../classes/types';

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
  TInputCallback extends (value: infer T) => void
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


export type TObservableConstructorArgs<T> = [((context: IObservableContext<T>) => (IObservableHook<T> | void))] | [];

// returns the type of an Observable
export type ObservableType<T extends IObservable<any>> = T extends IObservable<infer R> ? R : never;


/** INTERFACES **/

export interface IObservableConstructor {
  // creates an Observable
  new<T>(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
}

export interface IObservableTypedConstructor<T> {
  new(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
}

/**
 * An Observable is a push source: it emits data without any request from the receivers.
 * An Observable may be observed by many Observers.
 */
export interface IObservable<T> {
  // list of observers observing this observable
  readonly observers: IReadonlyList<IObserver<T>>;
  // true if this Observable is observed
  readonly observed: boolean;

  // observes this Observable with "observer"
  pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, T>; // returns the observer

  // creates an Observable from "callback" and observes this Observable with it
  pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, T>; // returns the observer

  // observes this Observable with "observableObserver.observer" and return the Observable
  pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, T>; // returns the observer of the observableObserver

  // observes this Observable with "observableObserver.observer" and return the observableObserver
  pipe<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeResult<OO, T>; // returns the observableObserver

  // like "pipeTo" but returns this instead
  observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, T, this>; // returns this
}

export type TObserverOrCallback<T> = IObserver<T> | ((value: T) => void);


/* ----------------------------- */


export interface IObservableContextConstructor {
  // creates an ObservableContext
  new<T>(observable: IObservable<T>): IObservableContext<T>;
}

/**
 * Bare minimal structure of the ObservableContext
 */
export interface IObservableContextBase<T> {
  readonly observable: IObservable<T>;

  emit(...args: any[]): any;
}

/**
 * Context provided when creating an Observable
 */
export interface IObservableContext<T> extends IObservableContextBase<T> {
  // emits 'value' to all the observers observing this observable
  emit(value: T): void;
}


/**
 * Objects to return when creating an Observable.
 */
export interface IObservableHook<T> {
  // called when an Observer observes this Observable.
  onObserved?(observer: IObserver<T>): void;

  // called when an Observer stops observing this Observable.
  onUnobserved?(observer: IObserver<T>): void;
}


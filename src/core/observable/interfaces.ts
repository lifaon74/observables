import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserver } from '../observer/interfaces';
import { IObservableObserver } from '../observable-observer/interfaces';

export type TObservableConstructorArgs<T> = [((context: IObservableContext<T>) => (IObservableHook<T> | void))] | [];

export interface IObservableConstructor {
  // creates an Observable
  new<T>(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
}

export interface IObservableTypedConstructor<T> {
  new(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
}

// type SuperSet<T, U> = {
//   [key in keyof T]: key extends keyof U
//     ? (U[key] extends T[key] ? T[key] : never)
//     : T[key]
// };

type SuperSet<T, U> = {
  [key in keyof T]: key extends keyof U
    ? (U[key] extends T[key] ? T[key] : U[key])
    : T[key]
};

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
  pipeTo<O extends IObserver<any>>(observer: SuperSet<O, IObserver<T>>): O;
  // creates an Observable from "callback" and observes this Observable with it
  pipeTo(callback: (value: T) => void): IObserver<T>;

  // observes this Observable with "observableObserver.observer" and return the Observable
  pipeThrough<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O['observable'];

  // observes this Observable with "observableObserver.observer" and return the observableObserver
  pipe<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O;

  // like "pipeTo" but returns this instead
  observedBy(...observers: TObserverOrCallback<T>[]): this;
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

// returns the type of an Observable
export type ObservableType<T extends IObservable<any>> = T extends IObservable<infer R> ? R : never;

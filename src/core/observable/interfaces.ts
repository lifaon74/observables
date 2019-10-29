import { IReadonlyList } from '../../misc/readonly-list/interfaces';
import { IObserver } from '../observer/interfaces';
import { IObservableObserver } from '../observable-observer/interfaces';
import { IObservableHook } from './hook/interfaces';
import { IObservableContext } from './context/interfaces';
import {
  TObservableObservedByResultNonCyclic, TObservablePipeResult, TObservablePipeThroughResult,
  TObservablePipeToCallbackResult, TObservablePipeToObserverResult, TObserverOrCallback
} from './types';


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

  // detaches all the observers observing this observable
  clearObservers(): this;
}




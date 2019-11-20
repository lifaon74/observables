import { IObservable } from '../interfaces';
import { IObservableContextBase } from './base/interfaces';

/** INTERFACES **/

/* PRIVATE */
export interface IObservableContextConstructor {
  new<T>(observable: IObservable<T>): IObservableContext<T>;
}

/**
 * Context provided when creating an Observable
 */
export interface IObservableContext<T> extends IObservableContextBase<T> {
  // emits 'value' to all the observers observing this observable
  emit(value: T): void;
}

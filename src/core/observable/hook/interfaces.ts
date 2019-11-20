import { IObserver } from '../../observer/interfaces';

/** INTERFACES **/

/**
 * Object to return when creating an Observable.
 */
export interface IObservableHook<T> {
  // called when an Observer observes this Observable.
  onObserved?(observer: IObserver<T>): void;

  // called when an Observer stops observing this Observable.
  onUnobserved?(observer: IObserver<T>): void;
}

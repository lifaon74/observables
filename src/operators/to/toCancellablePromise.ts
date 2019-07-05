import { IObservable } from '../../core/observable/interfaces';
import { TBasePromiseObservableNotification, toCancellablePromiseTuple } from './toPromise';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';


/**
 * Observes an Observable through a Promise.
 *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
 *  If the Observable sends a value, the promise is resolved with this value.
 * @param observable
 * @return a CancellablePromise
 */
export function toCancellablePromise<T>(observable: IObservable<TBasePromiseObservableNotification<T>> | IObservable<T>): ICancellablePromise<T> {
  const { promise, token } = toCancellablePromiseTuple(observable);
  return new CancellablePromise<T>(promise, token);

}


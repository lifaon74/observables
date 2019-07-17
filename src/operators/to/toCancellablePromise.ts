import { IObservable } from '../../core/observable/interfaces';
import { genericObservableToCancellablePromiseTuple } from './toPromise';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
import { ICancellablePromiseTuple } from '../../promises/interfaces';


/**
 * Observes an Observable through a Promise.
 *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
 *  If the Observable sends a value, the promise is resolved with this value.
 * @param observable
 * @return a CancellablePromise
 */
export function toCancellablePromise<T>(observable: IObservable<T>): ICancellablePromise<T> {
  const { promise, token } = genericObservableToCancellablePromiseTuple(observable) as ICancellablePromiseTuple<T>;
  return new CancellablePromise<T>(promise, token);

}


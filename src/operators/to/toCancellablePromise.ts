import { IObservable } from '../../core/observable/interfaces';
import { toCancellablePromiseTuple } from './toPromise';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
import { ICancellablePromiseTuple } from '../../promises/interfaces';
import { TFiniteStateObservableGeneric } from '../../notifications/observables/finite-state/interfaces';
import {
  IPromiseCancelToken
} from '../../notifications/observables/finite-state/promise/promise-cancel-token/interfaces';


/**
 * Observes an Observable through a Promise.
 *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
 *  If the Observable sends a value, the promise is resolved with this value.
 * @param observable
 * @param _token
 * @return a CancellablePromise
 */
export function toCancellablePromise<T>(
  observable: IObservable<T> | TFiniteStateObservableGeneric<T>,
  _token?: IPromiseCancelToken
): ICancellablePromise<T> {
  const { promise, token } = toCancellablePromiseTuple<T>(observable, 'never', _token) as ICancellablePromiseTuple<T | void>;
  return new CancellablePromise<T>(promise as Promise<T>, token);

}


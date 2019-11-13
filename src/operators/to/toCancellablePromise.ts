import { IObservable } from '../../core/observable/interfaces';
import { toCancellablePromiseTuple } from './toPromise';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
import { ICancellablePromiseTuple } from '../../promises/interfaces';
import {
  ICancelToken, TCancelStrategy
} from '../../misc/cancel-token/interfaces';
import { TFiniteStateObservableGeneric } from '../../notifications/observables/finite-state/types';


// /**
//  * Observes an Observable through a Promise.
//  *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
//  *  If the Observable sends a value, the promise is resolved with this value.
//  */
// export function toCancellablePromise<T, TStrategy extends TCancelStrategy>(
//   observable: IObservable<T> | TFiniteStateObservableGeneric<T>,
//   _token?: ICancelToken,
//   strategy?: TStrategy,
// ): ICancellablePromise<T, TStrategy> {
//   const { promise, token } = toCancellablePromiseTuple<T, TStrategy>(observable, strategy, _token) as ICancellablePromiseTuple<T | void>;
//   return new CancellablePromise<T, TStrategy>(promise as Promise<T>, token, strategy);
// }


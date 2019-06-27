import { IObservable } from '../../../core/observable/interfaces';


/**
 * Observes an Observable through a Promise.
 *  If the Observable sends a Notification, 'complete' or 'error' is expected as "name", and the promise is resolved of rejected.
 *  If the Observable sends a value, the promise is resolved with this value.
 * @param observable
 * @param strategy
 * @return a tuple: The Promise, and a PromiseCancelToken.
 */
export function toAsyncIterable<T>(observable: IObservable<T>): IAsyncIteratorOfObservable<T> {
  throw 'TODO';
}


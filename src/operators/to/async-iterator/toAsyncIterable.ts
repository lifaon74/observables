import { AsyncIteratorOfObservable } from './implementation';
import { ICompleteStateObservable } from '../../../notifications/observables/complete-state/interfaces';
import { IAsyncIteratorOfObservable } from './interfaces';


/**
 * Observes an Observable through an AsyncIterator.
 *  When the Observable emits a value, the AsyncIterator.next()'s Promise is resolved
 * @param observable
 */
export function toAsyncIterable<T>(observable: ICompleteStateObservable<T>): IAsyncIteratorOfObservable<T> {
  return new AsyncIteratorOfObservable<T>(observable);
}

// Example:
// async function test() {
//   for await(const value of toAsyncIterable<number>(new FromIterableObservable<number>([1, 2, 3]))) {
//     console.log(value);
//   }
//   // outputs: 1, 2, 3
// }



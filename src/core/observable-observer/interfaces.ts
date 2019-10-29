import { IObservable } from '../observable/interfaces';
import { IObserver } from '../observer/interfaces';

/** INTERFACES **/

/**
 * An ObservableObserver is both a Observable and a Observer: it receives and emits data.
 *  For example, it can be used to transform data.
 */
export interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  readonly observer: TObserver;
  readonly observable: TObservable;
}



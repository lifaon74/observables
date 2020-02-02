import { IObservable } from '../../../core/observable/interfaces';
import { IsObservable } from '../../../core/observable/constructor';
import { TObservableOrValue } from '../types';
import { Source } from '../../../observables/distinct/source/sync/implementation';

/**
 * Converts a value or an Observable to an Observable
 */
export function $observable<T>(input: TObservableOrValue<T>): IObservable<T> {
  return IsObservable(input)
    ? input
    : new Source<T>().emit(input as T);
}

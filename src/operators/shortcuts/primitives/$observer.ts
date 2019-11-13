import { IObserver } from '../../../core/observer/interfaces';
import { IsObserver } from '../../../core/observer/constructor';
import { Observer } from '../../../core/observer/implementation';
import { TObserverOrCallback } from '../../../core/observable/types';

/**
 * Converts a callback or an Observer to an Observer
 */
export function $observer<T>(input: TObserverOrCallback<T>): IObserver<T> {
  return IsObserver(input)
    ? input
    : new Observer<T>(input as (value: T) => void);
}

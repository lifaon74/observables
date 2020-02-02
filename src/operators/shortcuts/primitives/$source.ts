import { TSourceOrValue } from '../types';
import { IsObservable } from '../../../core/observable/constructor';
import { ISource } from '../../../observables/distinct/source/sync/interfaces';
import { IsSource } from '../../../observables/distinct/source/sync/constructor';
import { Source } from '../../../observables/distinct/source/sync/implementation';

/**
 * Converts a value or a Source as a Source
 */
export function $source<T>(input?: TSourceOrValue<T>): ISource<T> {
  if (IsSource(input)) {
    return input;
  } else if (IsObservable(input)) {
    throw new Error(`Cannot convert an input of type Observable to a Source`);
  } else {
    const source: ISource<T> = new Source<T>();
    if (arguments.length > 0) {
      source.emit(input as T);
    }
    return source;
  }
}

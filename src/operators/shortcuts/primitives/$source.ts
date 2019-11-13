import { TSourceOrValue } from '../types';
import { ISource } from '../../../observables/distinct/source/interfaces';
import { IsSource, Source } from '../../../observables/distinct/source/implementation';
import { IsObservable } from '../../../core/observable/constructor';

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

import { DistinctValueObservable } from '../../distinct-value-observable/sync/implementation';
import { ISource } from './interfaces';
import { IDistinctValueObservableContext } from '../../distinct-value-observable/sync/context/interfaces';
import { ConstructSource } from './constructor';
import { ISourceInternal, SOURCE_PRIVATE } from './privates';

/** METHODS **/

export function SourceEmit<T>(instance: ISource<T>, value: T): void {
  (instance as ISourceInternal<T>)[SOURCE_PRIVATE].context.emit(value);
}

/** CLASS **/

export class Source<T> extends DistinctValueObservable<T> implements ISource<T> {
  constructor() {
    let context: IDistinctValueObservableContext<T>;
    super((_context: IDistinctValueObservableContext<T>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructSource<T>(this, context);
  }


  emit(value: T): this {
    SourceEmit<T>(this, value);
    return this;
  }
}

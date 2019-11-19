import { IAsyncSource } from './interfaces';
import { ASYNC_SOURCE_PRIVATE, IAsyncSourceInternal } from './privates';
import { AsyncDistinctValueObservable } from '../../distinct-value-observable/async/implementation';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';
import { ConstructAsyncSource } from './constructor';
import {
  DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE, IAsyncDistinctValueObservablePrivate
} from '../../distinct-value-observable/async/privates';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

/** METHODS **/

/* GETTERS/SETTERS */

export function AsyncSourceGetPromise<T>(instance: IAsyncSource<T>): Promise<T> | null {
  return (instance as IAsyncSourceInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE].promise;
}

export function AsyncSourceGetSignal<T>(instance: IAsyncSource<T>): IAdvancedAbortSignal | null {
  const privates: IAsyncDistinctValueObservablePrivate<T> = (instance as IAsyncSourceInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE];
  return (privates.controller === null)
    ? null
    : privates.controller.signal;
}

/* METHODS */

export function AsyncSourceEmit<T>(instance: IAsyncSource<T>, promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<void> {
  return (instance as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context.emit(promise, signal);
}

/** CLASS **/

export class AsyncSource<T> extends AsyncDistinctValueObservable<T> implements IAsyncSource<T> {
  constructor() {
    let context: IAsyncDistinctValueObservableContext<T>;
    super((_context: IAsyncDistinctValueObservableContext<T>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructAsyncSource<T>(this, context);
  }

  get promise(): Promise<T> | null {
    return AsyncSourceGetPromise<T>(this);
  }

  get signal(): IAdvancedAbortSignal | null {
    return AsyncSourceGetSignal<T>(this);
  }

  emit(promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<this> {
    return AsyncSourceEmit<T>(this, promise, signal)
      .then(() => this);
  }
}

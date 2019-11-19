import { IAsyncDistinctValueObservable } from '../interfaces';
import { IAsyncDistinctValueObservableContext, IAsyncDistinctValueObservableContextConstructor } from './interfaces';
import { AllowObservableContextBaseConstruct } from '../../../../core/observable/context/base/constructor';
import { ObservableContextBase } from '../../../../core/observable/context/base/implementation';
import {
  IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE
} from '../../../../core/observable/context/base/privates';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { AsyncDistinctValueObservableEmit } from '../functions';

/** NEW **/

export function NewAsyncDistinctValueObservableContext<T>(observable: IAsyncDistinctValueObservable<T>): IAsyncDistinctValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IAsyncDistinctValueObservableContext<T> = new (AsyncDistinctValueObservableContext as IAsyncDistinctValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

/** METHODS **/

/* GETTERS/SETTERS */

export function AsyncDistinctValueObservableGetObservable<T>(instance: IAsyncDistinctValueObservableContext<T>): IAsyncDistinctValueObservable<T> {
  return (instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable;
}

/* METHODS */

export function AsyncDistinctValueObservableContextEmit<T>(context: IAsyncDistinctValueObservableContext<T>, promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<void> {
  return AsyncDistinctValueObservableEmit<T>(context.observable, promise, signal);
}

/** CLASS **/

export class AsyncDistinctValueObservableContext<T> extends ObservableContextBase<T> implements IAsyncDistinctValueObservableContext<T> {
  protected constructor(observable: IAsyncDistinctValueObservable<T>) {
    super(observable);
  }

  get observable(): IAsyncDistinctValueObservable<T> {
    return AsyncDistinctValueObservableGetObservable<T>(this);
  }

  emit(promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<void> {
    return AsyncDistinctValueObservableContextEmit<T>(this, promise, signal);
  }
}

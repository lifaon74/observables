import { IAsyncDistinctValueObservable } from '../interfaces';
import { IAsyncDistinctValueObservableContext, IAsyncDistinctValueObservableContextConstructor } from './interfaces';
import { AllowObservableContextBaseConstruct } from '../../../../../core/observable/context/base/constructor';
import { ObservableContextBase } from '../../../../../core/observable/context/base/implementation';
import {
  IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE
} from '../../../../../core/observable/context/base/privates';
import { AsyncDistinctValueObservableEmit } from '../functions';
import { TAsyncDistinctValueObservableContextEmitFactory } from './types';

/** NEW **/

export function NewAsyncDistinctValueObservableContext<T>(observable: IAsyncDistinctValueObservable<T>): IAsyncDistinctValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IAsyncDistinctValueObservableContext<T> = new (AsyncDistinctValueObservableContext as IAsyncDistinctValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

/** METHODS **/


export function AsyncDistinctValueObservableContextEmit<T>(context: IAsyncDistinctValueObservableContext<T>, factory: TAsyncDistinctValueObservableContextEmitFactory<T>): Promise<T> {
  return AsyncDistinctValueObservableEmit<T>(context.observable, factory);
}

/** CLASS **/

export class AsyncDistinctValueObservableContext<T> extends ObservableContextBase<T> implements IAsyncDistinctValueObservableContext<T> {
  protected constructor(observable: IAsyncDistinctValueObservable<T>) {
    super(observable);
  }

  get observable(): IAsyncDistinctValueObservable<T> {
    // @ts-ignore
    return super.observable as IAsyncDistinctValueObservable<T>;
  }

  emit(factory: TAsyncDistinctValueObservableContextEmitFactory<T>): Promise<T> {
    return AsyncDistinctValueObservableContextEmit<T>(this, factory);
  }
}

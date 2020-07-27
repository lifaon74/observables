import { ObservableContextBase } from '../../../../../core/observable/context/base/implementation';
import { IDistinctValueObservableContext, IDistinctValueObservableContextConstructor } from './interfaces';
import { IDistinctValueObservable } from '../interfaces';
import { AllowObservableContextBaseConstruct } from '../../../../../core/observable/context/base/constructor';
import { DistinctValueObservableEmit } from '../functions';

/** NEW **/

export function NewDistinctValueObservableContext<T>(observable: IDistinctValueObservable<T>): IDistinctValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IDistinctValueObservableContext<T> = new (DistinctValueObservableContext as IDistinctValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

/** METHODS **/


export function DistinctValueObservableContextEmit<T>(instance: IDistinctValueObservableContext<T>, value: T): void {
  DistinctValueObservableEmit<T>(instance.observable, value);
}

/** CLASS **/

export class DistinctValueObservableContext<T> extends ObservableContextBase<T> implements IDistinctValueObservableContext<T> {
  protected constructor(observable: IDistinctValueObservable<T>) {
    super(observable);
  }

  get observable(): IDistinctValueObservable<T> {
    // @ts-ignore
    return super.observable as IDistinctValueObservable<T>;
  }

  emit(value: T): void {
    DistinctValueObservableContextEmit<T>(this, value);
  }
}

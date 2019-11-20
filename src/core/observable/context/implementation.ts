import { ObservableContextBase } from './base/implementation';
import { IObservableContext, IObservableContextConstructor } from './interfaces';
import { IObservable } from '../interfaces';
import { AllowObservableContextBaseConstruct } from './base/constructor';
import { IObservableContextBase } from './base/interfaces';
import { ObservableEmitAll } from '../functions';
import { IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE } from './base/privates';

/** NEW **/

export function NewObservableContext<T>(observable: IObservable<T>): IObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IObservableContext<T> = new (ObservableContext as IObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}


/** METHODS **/

export function ObservableContextEmit<T>(instance: IObservableContextBase<T>, value: T): void {
  ObservableEmitAll<T>((instance as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable, value);
}


/** CLASS **/

/* PRIVATE */
export class ObservableContext<T> extends ObservableContextBase<T> implements IObservableContext<T> {

  protected constructor(observable: IObservable<T>) {
    super(observable);
  }

  emit(value: T): void {
    ObservableContextEmit<T>(this, value);
  }
}

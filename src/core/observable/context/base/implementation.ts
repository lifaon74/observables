import { IObservableContextBase } from './interfaces';
import { IObservable } from '../../interfaces';
import { ConstructObservableContextBase } from './constructor';
import { IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE } from './privates';

/** ABSTRACT CLASS **/

export abstract class ObservableContextBase<T> implements IObservableContextBase<T> {

  protected constructor(observable: IObservable<T>) {
    ConstructObservableContextBase<T>(this, observable);
  }

  get observable(): IObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable;
  }

  abstract emit(...args: any[]): any;
}

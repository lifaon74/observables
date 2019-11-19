import { IObservable } from '../../../../core/observable/interfaces';
import { IObservableContext, IObservableContextConstructor } from '../../../../core/observable/context/interfaces';
import { IDistinctValueObservable } from '../interfaces';

/** INTERFACES **/

export interface IDistinctValueObservableContextStatic extends Omit<IObservableContextConstructor, 'new'> {
}

export interface IDistinctValueObservableContextConstructor extends IDistinctValueObservableContextStatic {
  new<T>(observable: IObservable<T>): IDistinctValueObservableContext<T>;
}

export interface IDistinctValueObservableContext<T> extends IObservableContext<T> {
  readonly observable: IDistinctValueObservable<T>;
}

import { IObservable } from '../../../../../core/observable/interfaces';
import { IAsyncDistinctValueObservable } from '../interfaces';
import { IObservableContextConstructor } from '../../../../../core/observable/context/interfaces';
import { TAsyncDistinctValueObservableContextEmitFactory } from './types';

/** INTERFACES **/

export interface IAsyncDistinctValueObservableContextStatic extends Omit<IObservableContextConstructor, 'new'> {
}

export interface IAsyncDistinctValueObservableContextConstructor extends IAsyncDistinctValueObservableContextStatic {
  new<T>(observable: IObservable<T>): IAsyncDistinctValueObservableContext<T>;
}

export interface IAsyncDistinctValueObservableContext<T> {
  readonly observable: IAsyncDistinctValueObservable<T>;

  emit(factory: TAsyncDistinctValueObservableContextEmitFactory<T>): Promise<T>;
}

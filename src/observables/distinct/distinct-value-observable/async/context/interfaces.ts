import { IObservable } from '../../../../../core/observable/interfaces';
import { IAsyncDistinctValueObservable } from '../interfaces';
import { IAdvancedAbortSignal } from '../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IObservableContextConstructor } from '../../../../../core/observable/context/interfaces';

/** INTERFACES **/

export interface IAsyncDistinctValueObservableContextStatic extends Omit<IObservableContextConstructor, 'new'> {
}

export interface IAsyncDistinctValueObservableContextConstructor extends IAsyncDistinctValueObservableContextStatic {
  new<T>(observable: IObservable<T>): IAsyncDistinctValueObservableContext<T>;
}

export interface IAsyncDistinctValueObservableContext<T> {
  readonly observable: IAsyncDistinctValueObservable<T>;

  emit(promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<void>;
}

import { IDistinctValueObservable, IDistinctValueObservableConstructor } from '../distinct-value-observable/interfaces';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { IAsyncDistinctValueObservableContext } from './context/interfaces';


export type TAsyncDistinctValueObservableConstructorArgs<T> =
  [(context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)]
  | [];

/** INTERFACES **/

export interface IAsyncDistinctValueObservableStatic extends Omit<IDistinctValueObservableConstructor, 'new'> {
}

export interface IAsyncDistinctValueObservableConstructor extends IAsyncDistinctValueObservableStatic {
  new<T>(create?: (context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IAsyncDistinctValueObservable<T>;
}

export interface IAsyncDistinctValueObservableTypedConstructor<T> extends IAsyncDistinctValueObservableStatic {
  new(create?: (context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IAsyncDistinctValueObservable<T>;
}

/**
 * An AsyncDistinctValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the AsyncDistinctValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 */

export interface IAsyncDistinctValueObservable<T> extends IDistinctValueObservable<T> {
}



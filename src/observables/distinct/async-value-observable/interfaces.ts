import { IObservable} from '../../../core/observable/interfaces';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';
import { IDistinctValueObservable } from '../distinct-value-observable/interfaces';
import { IObservableHook } from '../../../core/observable/hook/interfaces';


export type TAsyncDistinctValueObservableConstructorArgs<T> =
  [(context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)]
  | [];

/**
 * An AsyncDistinctValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the AsyncDistinctValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 *
 */
export interface IAsyncDistinctValueObservableConstructor {
  new<T>(create?: (context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IAsyncDistinctValueObservable<T>;
}

export interface IAsyncDistinctValueObservable<T> extends IDistinctValueObservable<T> {
}


export interface IAsyncDistinctValueObservableContextConstructor {
  new<T>(observable: IObservable<T>): IAsyncDistinctValueObservableContext<T>;
}

export interface IAsyncDistinctValueObservableContext<T> {
  readonly observable: IAsyncDistinctValueObservable<T>;

  emit(promise: Promise<T>, token?: ICancelToken): Promise<void>;
}


import { IObservable, IObservableHook } from '../../../core/observable/interfaces';
import { IPromiseCancelToken } from '../../../notifications/observables/complete-state/promise-observable/promise-cancel-token/interfaces';
import { IValueObservable } from '../value-observable/interfaces';


export type TAsyncValueObservableConstructorArgs<T> =
  [(context: IAsyncValueObservableContext<T>) => (IObservableHook<T> | void)]
  | [];

/**
 * An AsyncValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the AsyncValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 *
 */
export interface IAsyncValueObservableConstructor {
  new<T>(create?: (context: IAsyncValueObservableContext<T>) => (IObservableHook<T> | void)): IAsyncValueObservable<T>;
}

export interface IAsyncValueObservable<T> extends IValueObservable<T> {
}


export interface IAsyncValueObservableContextConstructor {
  new<T>(observable: IObservable<T>): IAsyncValueObservableContext<T>;
}

export interface IAsyncValueObservableContext<T> {
  readonly observable: IAsyncValueObservable<T>;

  emit(promise: Promise<T>, token?: IPromiseCancelToken): Promise<void>;
}


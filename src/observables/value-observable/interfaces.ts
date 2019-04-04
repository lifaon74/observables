import { IObservable, IObservableConstructor, IObservableContext, IObservableHook } from '../../core/observable/interfaces';


export type TValueObservableConstructorArgs<T> = [(context: IValueObservableContext<T>) => (IObservableHook<T> | void)] | [];

/**
 * An ValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the ValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 *
 */
export interface IValueObservableConstructor {
  new<T>(create?: (context: IValueObservableContext<T>) => (IObservableHook<T> | void)): IValueObservable<T>;
}

export interface IValueObservable<T> extends IObservable<T> {
}


export interface IValueObservableContextConstructor {
  new<T>(observable: IObservable<T>): IValueObservableContext<T>;
}

export interface IValueObservableContext<T> extends IObservableContext<T> {
  readonly observable: IValueObservable<T>;
}


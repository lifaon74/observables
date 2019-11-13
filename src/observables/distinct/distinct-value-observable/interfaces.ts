import { IObservable} from '../../../core/observable/interfaces';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { IObservableContext } from '../../../core/observable/context/interfaces';


export type TDistinctValueObservableConstructorArgs<T> = [((context: IDistinctValueObservableContext<T>) => (IObservableHook<T> | void))?];

/**
 * An DistinctValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the DistinctValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 *
 */
export interface IDistinctValueObservableConstructor {
  new<T>(create?: (context: IDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IDistinctValueObservable<T>;
}

export interface IDistinctValueObservable<T> extends IObservable<T> {
}


export interface IDistinctValueObservableContextConstructor {
  new<T>(observable: IObservable<T>): IDistinctValueObservableContext<T>;
}

export interface IDistinctValueObservableContext<T> extends IObservableContext<T> {
  readonly observable: IDistinctValueObservable<T>;
}


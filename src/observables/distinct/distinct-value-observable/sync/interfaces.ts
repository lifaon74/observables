import { IObservable, IObservableConstructor } from '../../../../core/observable/interfaces';
import { IObservableHook } from '../../../../core/observable/hook/interfaces';
import { IDistinctValueObservableContext } from './context/interfaces';

/** INTERFACES **/

export interface IDistinctValueObservableStatic extends Omit<IObservableConstructor, 'new'> {
}

export interface IDistinctValueObservableConstructor extends IDistinctValueObservableStatic {
  new<T>(create?: (context: IDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IDistinctValueObservable<T>;
}

export interface IDistinctValueObservableTypedConstructor<T> extends IDistinctValueObservableStatic {
  new(create?: (context: IDistinctValueObservableContext<T>) => (IObservableHook<T> | void)): IDistinctValueObservable<T>;
}

/**
 * An DistinctValueObservable is an distinct value emitter:
 *
 * - Every Observers subscribing to the DistinctValueObservable will receive the last emitted value.
 * - A new value is emitted only if it is different than the previous one.
 */
export interface IDistinctValueObservable<T> extends IObservable<T> {
}




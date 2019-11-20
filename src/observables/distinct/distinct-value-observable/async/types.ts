import { IAsyncDistinctValueObservableContext } from './context/interfaces';
import { IObservableHook } from '../../../../core/observable/hook/interfaces';

/** TYPES **/

export type TAsyncDistinctValueObservableConstructorArgs<T> = [((context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void))?];

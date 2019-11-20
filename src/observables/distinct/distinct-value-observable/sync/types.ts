import { IObservableHook } from '../../../../core/observable/hook/interfaces';
import { IDistinctValueObservableContext } from './context/interfaces';

/** TYPES **/

export type TDistinctValueObservableConstructorArgs<T> = [((context: IDistinctValueObservableContext<T>) => (IObservableHook<T> | void))?];

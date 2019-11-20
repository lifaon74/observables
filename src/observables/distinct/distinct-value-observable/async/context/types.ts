import { IAdvancedAbortSignal } from '../../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IAsyncDistinctValueObservableContext } from './interfaces';

/** TYPES **/

export type TAsyncDistinctValueObservableContextEmitFactory<T> = (this: IAsyncDistinctValueObservableContext<T>, signal: IAdvancedAbortSignal) => Promise<T>;

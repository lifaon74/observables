import { IObservableConstructor } from '../../../../core/observable/interfaces';
import { IAsyncDistinctValueObservable } from '../../distinct-value-observable/async/interfaces';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

/** INTERFACES **/

export interface IAsyncSourceStatic extends Omit<IObservableConstructor, 'new'> {

}

export interface IAsyncSourceConstructor extends IAsyncSourceStatic {
  new<T>(): IAsyncSource<T>;
}

export interface IAsyncSourceTypedConstructor<T> extends IAsyncSourceStatic {
  new(): IAsyncSource<T>;
}

/**
 * An AsyncSource is similar to a Source, but takes a Promise instead of a value (and an optional AdvancedAbortSignal),
 * then waits until the promise is resolved (fulfilled or rejected), and emits the values with the same behaviour than a Source.
 */
export interface IAsyncSource<T> extends IAsyncDistinctValueObservable<T> {
  readonly promise: Promise<T> | null;
  readonly signal: IAdvancedAbortSignal | null;

  emit(promise: Promise<T>, signal?: IAdvancedAbortSignal): Promise<this>;
}

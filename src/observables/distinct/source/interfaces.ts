import { IObservable, IObservableConstructor } from '../../../core/observable/interfaces';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';
import { IValueObservable } from '../value-observable/interfaces';


export interface ISourceConstructor {
  new<T>(): ISource<T>;
}

/**
 * A Source is an distinct value emitter:
 *
 * - Every Observers subscribing to the Source will receive the last emitted value:
 *      new Source().emit(123).pipeTo(console.log.bind(console)).activate(); // print 123
 *
 * - A new value is emitted only if it is different than the previous one:
 *      const source = new Source();
 *      source.pipeTo(console.log.bind(console)).activate();
 *      source.emit(123); // print 123
 *      source.emit(123); // nothing append
 *      source.emit(0); // print 0
 *
 */
export interface ISource<T> extends IValueObservable<T> {
  readonly value: T | undefined; // last emitted value
  valueOf(): T | undefined;

  emit(value: T): this;
}


/*--------------------------*/


export interface IAsyncSourceConstructor extends IObservableConstructor {
  new<T>(): IAsyncSource<T>;
}

/**
 * An AsyncSource is similar to a Source, but takes a Promise instead of a value (and an optional CancelToken),
 * then waits until the promise is resolved (fulfilled or rejected), and emits the values with the same behaviour than a Source.
 */
export interface IAsyncSource<T> extends IObservable<T> {
  readonly promise: Promise<T> | null;
  readonly token: ICancelToken | null;

  emit(promise: Promise<T>, token?: ICancelToken): Promise<this>;
}

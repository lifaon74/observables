import { IObservable, IObservableConstructor, IObservableContext } from '../../core/observable/interfaces';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { KeyValueMapGeneric } from '../../notifications/core/interfaces';
import { INotification } from '../../notifications/core/notification/interfaces';
import { INotificationsObservable } from '../../notifications/core/notifications-observable/interfaces';
import { IValueObservable, IValueObservableConstructor } from '../value-observable/interfaces';


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
  readonly value: T; // last emitted value
  valueOf(): T;

  emit(value: T): this;
}


/*--------------------------*/


export interface IAsyncSourceConstructor extends IObservableConstructor {
  new<T>(): IAsyncSource<T>;
}

/**
 * An AsyncSource is similar to a Source, but takes a Promise instead of a value (and an optional PromiseCancelToken),
 * then waits until the promise is resolved (fulfilled or rejected), and emits the values with the same behaviour than a Source.
 */
export interface IAsyncSource<T> extends IObservable<T> {
  readonly promise: Promise<T>;
  readonly token: IPromiseCancelToken | null;

  emit(promise: Promise<T>, token?: IPromiseCancelToken): Promise<this>;
}

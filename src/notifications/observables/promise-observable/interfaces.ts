import {
  INotificationsObservable, KeyValueMapToNotifications
} from '../../core/notifications-observable/interfaces';
import { IPromiseCancelToken } from './promise-cancel-token/interfaces';


/**
 * 'complete' if fulfilled, 'error' if rejected, 'cancel' if cancelled
 */
export interface IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled> {
  complete: TFulfilled;
  error: TErrored;
  cancel: TCancelled;
}

export type TPromiseNotificationKeys = Extract<keyof IPromiseNotificationKeyValueMap<any, any, any>, string>;


export interface IPromiseObservableConstructor {
  new<TFulfilled, TErrored, TCancelled>(promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled>;
}

export interface IPromiseObservableTypedConstructor<TFulfilled, TErrored, TCancelled> {

  fromPromise<TFulfilled, TErrored, TCancelled>(promise: Promise<TFulfilled>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled>;

  new(promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled>;
}


/**
 * A PromiseObservable allows to build classes that transform Promises to Observables.
 */
export interface IPromiseObservable<TFulfilled, TErrored, TCancelled> extends INotificationsObservable<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>> {
  clearCachedPromise(): void;
}

export interface IPromiseObservableClearOptions {
  immediate?: boolean; // default false
  complete?: boolean; // default false
  error?: boolean; // default true
  cancel?: boolean; // default true
}

export interface IPromiseObservableOptions {
  clear?: IPromiseObservableClearOptions;
}



// export type TPromiseObserverType<T> = IObserver<INotification<TPromiseNotificationType, T>>;
export type TPromiseObservableNotification<TFulfilled, TErrored, TCancelled> = KeyValueMapToNotifications<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>>;

export type TCancellablePromiseTuple<T> = [Promise<T>, IPromiseCancelToken];

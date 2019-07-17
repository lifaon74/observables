import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';
import { IPromiseCancelToken } from '../promise-cancel-token/interfaces';
import {
  ICompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable, ICompleteStateObservableOptions,
  TCompleteStateObservableMode
} from '../../interfaces';
import { TPromiseOrValue } from '../../../../../promises/interfaces';

/** TYPES **/

export type TPromiseObservableMode = TCompleteStateObservableMode;

export interface IPromiseObservableKeyValueMap<T> extends ICompleteStateObservableKeyValueMapGeneric<T> {
  cancel: any;
}

// export type TPromiseObserverType<T> = IObserver<INotification<TPromiseNotificationType, T>>;
export type TPromiseObservableNotifications<T> = KeyValueMapToNotifications<IPromiseObservableKeyValueMap<T>>;
// export type TPromiseNotificationKeys = Extract<keyof IPromiseNotificationKeyValueMap<any>, string>;


export interface IPromiseObservableResetOptions {
  immediate?: boolean; // default false => if true, calls the factory for each observer
  // if one of the following is true, calls the factory when the observer is freshly observed,
  // and resets the cache and the state of the PromiseObservable depending on the promise's state
  complete?: boolean; // default false => if true, reset when the promise if fulfilled
  error?: boolean; // default true => if true, reset when the promise if errored
}

export interface IPromiseObservableOptions extends ICompleteStateObservableOptions {
  mode?: TPromiseObservableMode;
  reset?: IPromiseObservableResetOptions;
}


export type TPromiseObservableFactory<T> = (this: IPromiseObservable<T>, token: IPromiseCancelToken) => TPromiseOrValue<T>;

/** INTERFACES **/

export interface IPromiseObservableConstructor {
  new<T>(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;

  fromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T>;
}

export interface IPromiseObservableTypedConstructor<T> {
  new(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;

  fromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T>;
}


/**
 * A PromiseObservable allows to build classes that transform Promises to Observables.
 */
export interface IPromiseObservable<T> extends ICompleteStateObservable<T, IPromiseObservableKeyValueMap<T>> {
}



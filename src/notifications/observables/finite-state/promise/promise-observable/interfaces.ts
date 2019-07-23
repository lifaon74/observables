import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';
import { IPromiseCancelToken } from '../promise-cancel-token/interfaces';
import {
  IFiniteStateObservableKeyValueMapGeneric, IFiniteStateObservable, IFiniteStateObservableOptions,
  TFiniteStateObservableMode, TFiniteStateObservableFinalState, IFiniteStateObservableExposedOptions
} from '../../interfaces';
import { TPromiseOrValue } from '../../../../../promises/interfaces';

/** TYPES **/

export type TPromiseObservableFinalState = TFiniteStateObservableFinalState | 'cancel';
export type TPromiseObservableMode = TFiniteStateObservableMode | 'every';

export interface IPromiseObservableKeyValueMap<T> extends IFiniteStateObservableKeyValueMapGeneric<T, TPromiseObservableFinalState> {
  cancel: any;
}

// export type TPromiseObserverType<T> = IObserver<INotification<TPromiseNotificationType, T>>;
export type TPromiseObservableNotifications<T> = KeyValueMapToNotifications<IPromiseObservableKeyValueMap<T>>;
// export type TPromiseNotificationKeys = Extract<keyof IPromiseNotificationKeyValueMap<any>, string>;


export interface IPromiseObservableOptions extends IFiniteStateObservableExposedOptions<TPromiseObservableMode> {
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
export interface IPromiseObservable<T> extends IFiniteStateObservable<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
}






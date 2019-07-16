import { Notification } from '../../../core/notification/implementation';
import { IPromiseCancelToken } from './promise-cancel-token/interfaces';
import {
  IPromiseObservableKeyValueMap, IPromiseObservable, IPromiseObservableClearOptions, IPromiseObservableOptions,
  TPromiseObservableFactory,
  TPromiseObservableNotifications
} from './interfaces';
import {
  INotificationsObservablePrivate, NOTIFICATIONS_OBSERVABLE_PRIVATE, NotificationsObservable
} from '../../../core/notifications-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { IObservableHook } from '../../../../core/observable/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { PromiseCancelToken } from './promise-cancel-token/implementation';
import { Reason } from '../../../../misc/reason/implementation';
import { IsObject } from '../../../../helpers';
import { ICancellablePromiseTuple } from '../../../../promises/interfaces';
import { ICompleteStateObservable } from '../interfaces';
import { CompleteStateObservable } from '../implementation';
import { TNotificationsObservableHook } from '../../../core/notifications-observable/interfaces';
import {
  CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal
} from '../../../../promises/cancellable-promise/implementation';



/**
 * Waits until the promise is resolved, then returns a Notification describing its state.
 * @param promise
 * @param token
 */
// export function PromiseToNotification<T>(promise: Promise<T>, token?: IPromiseCancelToken): Promise<TPromiseObservableNotification<T>> {
//   if (token === void 0) {
//     return promise
//       .then((value: T) => {
//         return new Notification<'complete', T>('complete', value);
//       }, (error: any) => {
//         return new Notification<'error', any>('error', error);
//       });
//   } else {
//     const cancelPromise = new Promise<TPromiseObservableNotification<T>>((resolve) => {
//       const observer = token
//         .addListener('cancel', () => {
//           resolve(new Notification<'cancel', any>('cancel', token.reason));
//           observer.deactivate();
//         });
//       observer.activate();
//     });
//
//     return Promise.race([
//       cancelPromise,
//       promise
//         .then((value: T) => {
//           return token.cancelled
//             ? new Notification<'cancel', any>('cancel', token.reason)
//             : new Notification<'complete', T>('complete', value);
//         }, (error: any) => {
//           return token.cancelled
//             ? new Notification<'cancel', any>('cancel', token.reason)
//             : new Notification<'error', any>('error', error);
//         })
//     ]);
//   }
// }

// export function PromiseToNotifications<T>(promise: Promise<T>, token?: IPromiseCancelToken): Promise<TPromiseObservableNotification<T>[]> {
//   if (token === void 0) {
//     return promise
//       .then((value: T) => {
//         return [
//           new Notification<'next', T>('next', value),
//           new Notification<'complete', T>('complete', void 0)
//         ];
//       }, (error: any) => {
//         return [
//           new Notification<'error', any>('error', error),
//         ];
//       });
//   } else {
//     token.wrapPromise(
//     const cancelPromise = new Promise<TPromiseObservableNotification<T>>((resolve) => {
//       const observer = token
//         .addListener('cancel', () => {
//           resolve(new Notification<'cancel', any>('cancel', token.reason));
//           observer.deactivate();
//         });
//       observer.activate();
//     });
//
//     return Promise.race([
//       cancelPromise,
//       promise
//         .then((value: T) => {
//           return token.cancelled
//             ? new Notification<'cancel', any>('cancel', token.reason)
//             : new Notification<'complete', T>('complete', value);
//         }, (error: any) => {
//           return token.cancelled
//             ? new Notification<'cancel', any>('cancel', token.reason)
//             : new Notification<'error', any>('error', error);
//         })
//     ]);
//   }
// }

export const PROMISE_OBSERVABLE_PRIVATE = Symbol('promise-observable-private');

export interface IPromiseObservablePrivate<T> {
  promiseFactory: TPromiseObservableFactory<T>;

  clear: IPromiseObservableClearOptions;
  promise: Promise<TPromiseObservableNotifications<T>> | null; // cached promise
  token: IPromiseCancelToken | null; // cancel token associated with the cached promise
  observerToPromiseMap: WeakMap<IObserver<TPromiseObservableNotifications<T>>, ICancellablePromiseTuple<TPromiseObservableNotifications<T>>>;
}

export interface IPromiseObservableInternal<T> extends IPromiseObservable<T> {
  [PROMISE_OBSERVABLE_PRIVATE]: IPromiseObservablePrivate<T>;
}


export function ConstructPromiseObservable<T>(
  instance: IPromiseObservable<T>,
  promiseFactory: TPromiseObservableFactory<T>,
  options: IPromiseObservableOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, PROMISE_OBSERVABLE_PRIVATE);
  const privates: IPromiseObservablePrivate<T> = (instance as IPromiseObservableInternal<T>)[PROMISE_OBSERVABLE_PRIVATE];

  if (typeof promiseFactory === 'function') {
    privates.promiseFactory = promiseFactory;
  } else {
    throw new TypeError(`Expected function as promiseFactory when creating a PromiseObservable.`);
  }

  let clear: IPromiseObservableClearOptions;
  if (options.clear === void 0) {
    clear = {};
  } else if (IsObject(options.clear)) {
    clear = options.clear;
  } else {
    throw new TypeError(`Expected object or void as options.clear when creating a PromiseObservable`);
  }

  privates.clear = {
    immediate: (clear.immediate === void 0) ? false : Boolean(clear.immediate),
    complete: (clear.complete === void 0) ? false : Boolean(clear.complete),
    error: (clear.error === void 0) ? true : Boolean(clear.error),
    cancel: (clear.cancel === void 0) ? true : Boolean(clear.cancel),
  };

  privates.promise = null;
  privates.token = null;
  privates.observerToPromiseMap = new WeakMap<
    IObserver<TPromiseObservableNotifications<T>>,
    ICancellablePromiseTuple<TPromiseObservableNotifications<T>>
  >();
}

export function IsPromiseObservable(value: any): value is IPromiseObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(PROMISE_OBSERVABLE_PRIVATE as symbol);
}

export function PromiseObservableClearCachedPromise<T>(instance: IPromiseObservable<T>): void {
  type TInternal = IPromiseObservableInternal<T>;
  (instance as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise = null;
  (instance as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token = null;
}


export function PromiseObservableOnObserved<T>(instance: IPromiseObservable<T>, observer: IObserver<TPromiseObservableNotifications<T>>): void {
  const privates: IPromiseObservablePrivate<T> = (instance as IPromiseObservableInternal<T>)[PROMISE_OBSERVABLE_PRIVATE];
  // if (
  //   (instance.observers.length === 1)
  //   && (instance.state === 'emitting')
  // ) {
  //
  // }

  // fix token and promise in case promiseFactory calls clearCachedPromise
  let promise: Promise<TPromiseObservableNotifications<T> | void>;
  let token: IPromiseCancelToken;

  if (privates.promise === null) { // no cached promise
    token = new PromiseCancelToken();
    promise = token.wrapFunction(privates.promiseFactory)(token) as Promise<TPromiseObservableNotifications<T> | void>;
    // promise = PromiseToNotification<T>(privates.promiseFactory(token), token); // build the promise
    // if (!privates.clear.immediate) {
    //   privates.promise = promise;
    //   privates.token = token;
    // }
  } else {
    promise = privates.promise;
    token = privates.token as IPromiseCancelToken;
  }

  privates.observerToPromiseMap.set(observer, {
    promise: promise,
    token: token,
  });

  promise
    .then((notification: TPromiseObservableNotifications<T>) => { // promise resolved (fulfilled, rejected or cancelled)
      if (
        (privates.promise === promise)
        && (
          (privates.clear.complete && (notification.name === 'complete'))
          || (privates.clear.error && (notification.name === 'error'))
          || (privates.clear.cancel && (notification.name === 'cancel'))
        )
      ) {
        PromiseObservableClearCachedPromise<T>(instance);
      }

      if (privates.observerToPromiseMap.has(observer)) {
        privates.observerToPromiseMap.delete(observer);
        observer.emit(notification);
      }
    });
}

export function PromiseObservableOnUnobserved<T>(instance: IPromiseObservable<T>, observer: IObserver<TPromiseObservableNotifications<T>>): void {
  type TInternal = IPromiseObservableInternal<T>;
  const privates: IPromiseObservablePrivate<T> = (instance as TInternal)[PROMISE_OBSERVABLE_PRIVATE];

  if (
    (privates.token !== null) // shared promise pending
    && (!instance.observed) // no more observer
  ) { // => promise can be cancelled
    privates.token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
  } else if (privates.observerToPromiseMap.has(observer)) { // promise still pending for this observer
    const { promise, token }: ICancellablePromiseTuple<TPromiseObservableNotifications<T>> = privates.observerToPromiseMap.get(observer) as ICancellablePromiseTuple<TPromiseObservableNotifications<T>>;
    privates.observerToPromiseMap.delete(observer);
    if (promise !== privates.promise) { // promise not shared => it can be cancelled
      token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
    }
  }
}


export function PromiseObservableFromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
  return new PromiseObservable<T>((_token: IPromiseCancelToken) => {
    if (token !== void 0) {
      _token.linkWithToken(token);
    }
    return promise;
  }, options);
}

export class PromiseObservable<T> extends CompleteStateObservable<T, IPromiseObservableKeyValueMap<T>> implements IPromiseObservable<T> {

  static fromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
    return PromiseObservableFromPromise<T>(promise, token, options);
  }

  constructor(promiseFactory: TPromiseObservableFactory<T>, options: IPromiseObservableOptions = {}) {
    super((): TNotificationsObservableHook<IPromiseObservableKeyValueMap<T>> => {
      return {
        onObserved: (observer: IObserver<TPromiseObservableNotifications<T>>) => {
          PromiseObservableOnObserved<T>(this, observer);
        },
        onUnobserved: (observer: IObserver<TPromiseObservableNotifications<T>>) => {
          PromiseObservableOnUnobserved<T>(this, observer);
        }
      };
    });
    ConstructPromiseObservable<T>(this, promiseFactory, options);
  }

  clearCachedPromise(): void {
    // PromiseObservableClearCachedPromise<T>(this);
  }
}


/*
function doRequestWithTimeout(timeout: number = 60000, token?: PromiseCancelToken) {
  const _token = new PromiseCancelToken();

  setTimeout(() => {
    _token.cancel(new Reason(`Timeout reached`, 'TIMEOUT'));
  }, timeout);

  if (token !== void 0) {
    _token.linkWithToken(token);
  }

  return _token.wrapPromise(fetch(..._token.wrapFetchArguments('http://domain.com/request1')));
}
*/

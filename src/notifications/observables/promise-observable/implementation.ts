import { Notification } from '../../core/notification/implementation';
import { IPromiseCancelToken } from './promise-cancel-token/interfaces';
import {
  IPromiseNotificationKeyValueMap, IPromiseObservable, IPromiseObservableClearOptions, IPromiseObservableOptions,
  TCancellablePromiseTuple, TPromiseObservableNotification
} from './interfaces';
import {
  INotificationsObservablePrivate, NOTIFICATIONS_OBSERVABLE_PRIVATE, NotificationsObservable
} from '../../core/notifications-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IObservableHook } from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { PromiseCancelToken } from './promise-cancel-token/implementation';
import { Reason } from '../../../misc/reason/implementation';
import { IsObject } from '../../../helpers';
import { INotificationsObserver } from '../../core/notifications-observer/interfaces';


/**
 * Waits until the promise is resolved, and then returns a Notification describing its state.
 * @param promise
 * @param token
 */
export function PromiseToNotification<TFulfilled, TErrored, TCancelled>(promise: Promise<TFulfilled>, token?: IPromiseCancelToken): Promise<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>> {
  if (token === void 0) {
    return promise
      .then((value: TFulfilled) => {
        return new Notification<'complete', TFulfilled>('complete', value);
      }, (error: TErrored) => {
        return new Notification<'error', TErrored>('error', error);
      });
  } else {
    const cancelPromise = new Promise<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>((resolve) => {
      const observer = token
        .addListener('cancel', () => {
          resolve(new Notification<'cancel', TCancelled>('cancel', token.reason));
          observer.deactivate();
        }).activate();
    });

    return Promise.race([
      cancelPromise,
      promise
        .then((value: TFulfilled) => {
          return token.cancelled
            ? new Notification<'cancel', TCancelled>('cancel', token.reason)
            : new Notification<'complete', TFulfilled>('complete', value);
        }, (error: TErrored) => {
          return token.cancelled
            ? new Notification<'cancel', TCancelled>('cancel', token.reason)
            : new Notification<'error', TErrored>('error', error);
        })
    ]);
  }
}



export const PROMISE_OBSERVABLE_PRIVATE = Symbol('promise-observable-private');

export interface IPromiseObservablePrivate<TFulfilled, TErrored, TCancelled> {
  promiseFactory(token: IPromiseCancelToken): Promise<TFulfilled>;
  clear: IPromiseObservableClearOptions;
  promise: Promise<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>> | null; // cached promise
  token: IPromiseCancelToken | null; // cancel token associated with the cached promise
  observerToPromiseMap: WeakMap<IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>, TCancellablePromiseTuple<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>>;
}

export interface IPromiseObservableInternal<TFulfilled, TErrored, TCancelled> extends IPromiseObservable<TFulfilled, TErrored, TCancelled> {
  [NOTIFICATIONS_OBSERVABLE_PRIVATE]: INotificationsObservablePrivate<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>>;
  [PROMISE_OBSERVABLE_PRIVATE]: IPromiseObservablePrivate<TFulfilled, TErrored, TCancelled>;
}


export function ConstructPromiseObservable<TFulfilled, TErrored, TCancelled>(
  observable: IPromiseObservable<TFulfilled, TErrored, TCancelled>,
  promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>,
  options: IPromiseObservableOptions = {}
): void {
  type TInternal = IPromiseObservableInternal<TFulfilled, TErrored, TCancelled>;

  if (typeof promiseFactory !== 'function') {
    throw new TypeError(`Expected function as promiseFactory when creating a PromiseObservable.`);
  }

  let clear: IPromiseObservableClearOptions;
  if (options.clear == void 0) {
    clear = {};
  } else if ((typeof options.clear === 'object') && (options.clear !== null)) {
    clear = options.clear;
  } else {
    throw new TypeError(`Expected object or void as options.clear when creating a PromiseObservable`);
  }

  ConstructClassWithPrivateMembers(observable, PROMISE_OBSERVABLE_PRIVATE);
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promiseFactory = promiseFactory;
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].clear = {
    immediate: (clear.immediate === void 0) ? false : Boolean(clear.immediate),
    complete: (clear.complete === void 0) ? false : Boolean(clear.complete),
    error: (clear.error === void 0) ? true : Boolean(clear.error),
    cancel: (clear.cancel === void 0) ? true : Boolean(clear.cancel),
  };
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise = null;
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token = null;
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap = new WeakMap<
    IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>,
    TCancellablePromiseTuple<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>
  >();
}

export function IsPromiseObservable(value: any): value is IPromiseObservable<any, any, any> {
  return IsObject(value)
    && value.hasOwnProperty(PROMISE_OBSERVABLE_PRIVATE);
}

export function PromiseObservableClearCachedPromise<TFulfilled, TErrored, TCancelled>(observable: IPromiseObservable<TFulfilled, TErrored, TCancelled>): void {
  type TInternal = IPromiseObservableInternal<TFulfilled, TErrored, TCancelled>;
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise = null;
  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token = null;
}


export function PromiseObservableOnObserved<TFulfilled, TErrored, TCancelled>(observable: IPromiseObservable<TFulfilled, TErrored, TCancelled>, observer: IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>): void {
  type TInternal = IPromiseObservableInternal<TFulfilled, TErrored, TCancelled>;
  const clear: IPromiseObservableClearOptions = (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].clear;

  // fix token and promise in case promiseFactory calls clearCachedPromise
  let promise: Promise<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>> | null;
  let token: IPromiseCancelToken;

  if ((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise === null) { // no cached promise
    token = new PromiseCancelToken();
    promise = PromiseToNotification<TFulfilled, TErrored, TCancelled>((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promiseFactory(token), token); // build the promise
    if (!clear.immediate) {
      (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise = promise;
      (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token = token;
    }
  } else {
    promise = (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise;
    token = (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token;
  }

  (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.set(observer, [promise, token]);

  promise
    .then((notification: TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>) => { // promise resolved (fulfilled, rejected or cancelled)
      if (
        ((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise === promise)
        && (
          (clear.complete && (notification.name === 'complete'))
          || (clear.error && (notification.name === 'error'))
          || (clear.cancel && (notification.name === 'cancel'))
        )
      ) {
        PromiseObservableClearCachedPromise<TFulfilled, TErrored, TCancelled>(observable);
      }

      if ((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.has(observer)) {
        (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.delete(observer);
        observer.emit(notification);
      }
    });
}

export function PromiseObservableOnUnobserved<TFulfilled, TErrored, TCancelled>(observable: IPromiseObservable<TFulfilled, TErrored, TCancelled>, observer: IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>): void {
  type TInternal = IPromiseObservableInternal<TFulfilled, TErrored, TCancelled>;

  if (
    ((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token !== null) // shared promise pending
    && (!observable.observed) // no more observer
  ) { // => promise can be cancelled
    (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
  } else if ((observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.has(observer)) { // promise still pending for this observer
    const [promise, token]: TCancellablePromiseTuple<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>> = (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.get(observer);
    (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].observerToPromiseMap.delete(observer);
    if (promise !== (observable as TInternal)[PROMISE_OBSERVABLE_PRIVATE].promise) { // promise not shared => it can be cancelled
      token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
    }
  }
}


export function PromiseObservableFromPromise<TFulfilled, TErrored, TCancelled>(promise: Promise<TFulfilled>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled> {
  return new PromiseObservable<TFulfilled, TErrored, TCancelled>((_token: IPromiseCancelToken) => {
    const tokenObserver: INotificationsObserver<'cancel', any> = token.addListener('cancel', (reason: any) => {
      _token.cancel(reason);
    }).activate();

    return promise
      .finally(() => {
        tokenObserver.deactivate();
      });
  }, options);
}

export class PromiseObservable<TFulfilled, TErrored, TCancelled> extends NotificationsObservable<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>> implements IPromiseObservable<TFulfilled, TErrored, TCancelled> {

  static fromPromise<TFulfilled, TErrored, TCancelled>(promise: Promise<TFulfilled>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled> {
    return PromiseObservableFromPromise<TFulfilled, TErrored, TCancelled>(promise, token, options);
  }

  constructor(promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>, options: IPromiseObservableOptions = {}) {
    super((): IObservableHook<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>> => {
      return {
        onObserved: (observer: IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>) => {
          PromiseObservableOnObserved<TFulfilled, TErrored, TCancelled>(this, observer);
        },
        onUnobserved: (observer: IObserver<TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>>) => {
          PromiseObservableOnUnobserved<TFulfilled, TErrored, TCancelled>(this, observer);
        }
      }
    });
    ConstructPromiseObservable<TFulfilled, TErrored, TCancelled>(this, promiseFactory, options);
  }

  clearCachedPromise(): void {
    PromiseObservableClearCachedPromise<TFulfilled, TErrored, TCancelled>(this);
  }
}



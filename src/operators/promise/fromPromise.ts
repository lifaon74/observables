import { PromiseToNotification } from '../../notifications/observables/promise-observable/implementation';
import { INotificationsObservable, INotificationsObservableContext } from '../../notifications/core/notifications-observable/interfaces';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { NotificationsObservable } from '../../notifications/core/notifications-observable/implementation';
import { IPromiseNotificationKeyValueMap, TPromiseObservableNotification } from '../../notifications/observables/promise-observable/interfaces';


export function fromPromise<TFulfilled, TErrored, TCancelled>(promise: Promise<TFulfilled>, token?: IPromiseCancelToken): INotificationsObservable<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>> {
  return new NotificationsObservable<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>>((context: INotificationsObservableContext<IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled>>) => {
    PromiseToNotification<TFulfilled, TErrored, TCancelled>(promise, token)
      .then((notification: TPromiseObservableNotification<TFulfilled, TErrored, TCancelled>) => {
        context.emit(notification);
      });
  });
}
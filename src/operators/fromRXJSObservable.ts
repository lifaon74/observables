import {
  INotificationsObservable,
  INotificationsObservableContext,
  KeyValueMapToNotifications
} from '../notifications/core/notifications-observable/interfaces';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import { ObservableClearObservers } from '../core/observable/implementation';
import { IOnObservableCompleteOptions, NormalizeOnObservableCompleteAction } from './helpers';

export interface IRXJSObservableNotificationKeyValueMap<TValue, TError> {
  next: TValue;
  error: TError;
  complete: void;
}


export interface IFromRXJSObservableOptions extends IOnObservableCompleteOptions{
}

export function fromRXJSObservable<TValue, TError>(rxObservable: RXObservable<TValue>, options: IFromRXJSObservableOptions = {}): INotificationsObservable<IRXJSObservableNotificationKeyValueMap<TValue, TError>> {
  const _options: IFromRXJSObservableOptions = {
    onComplete: NormalizeOnObservableCompleteAction(options.onComplete),
  };

  return new NotificationsObservable<IRXJSObservableNotificationKeyValueMap<TValue, TError>>((context: INotificationsObservableContext<IRXJSObservableNotificationKeyValueMap<TValue, TError>>) => {
    let rxSubscription: RXSubscription | null = null;
    let complete: boolean = false;

    const onComplete = () => {
      complete = true;
      if (rxSubscription === null) { // still initializing
        setTimeout(onComplete, 0);
      } else {
        context.dispatch('complete');
        if ((_options.onComplete === 'clear') || (_options.onComplete === 'clear-strict')) {
          ObservableClearObservers<KeyValueMapToNotifications<IRXJSObservableNotificationKeyValueMap<TValue, TError>>>(context.observable);
        }
      }
    };

    return {
      onObserved: (): void => {
        if (complete && (_options.onComplete === 'clear-strict')) {
          throw new Error(`Cannot observe this Observable, because RX.Observable is complete.`);
        } else if (rxSubscription === null) {
          rxSubscription = rxObservable.subscribe(
            (value: TValue) => {
              context.dispatch('next', value);
            },
            (error: TError) => {
              context.dispatch('error', error);
            }, onComplete);
        }
      },
      onUnobserved: (): void => {
        if (!context.observable.observed) {
          rxSubscription.unsubscribe();
          rxSubscription = null;
        }
      }
    };
  });
}

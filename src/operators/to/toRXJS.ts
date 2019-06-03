import { Notification } from '../../notifications/core/notification/implementation';
import { IObservable } from '../../core/observable/interfaces';
import { Observer } from '../../core/observer/implementation';
import { IFromRXJSObservableNotificationKeyValueMap } from '../../observables/from/rxjs/interfaces';
import { Observable as RXObservable, Subscriber } from 'rxjs';
import { IObserver } from '../../core/observer/interfaces';
import { IsObservable } from '../../core/observable/implementation';
import { TValueOrNotificationType } from './toPromise';

export type TBaseRXJSObservableNotification<T> = IFromRXJSObservableNotificationKeyValueMap<T, any>;


export function toRXJS<T>(observable: IObservable<TBaseRXJSObservableNotification<T>> | IObservable<T>): RXObservable<T> {

  let subscriber: Subscriber<T>;

  const observer: IObserver<TValueOrNotificationType<T>> = new Observer<TValueOrNotificationType<T>>((value: TValueOrNotificationType<T>) => {
    if (value instanceof Notification) {
      switch (value.name) {
        case 'complete':
          subscriber.complete();
          break;
        case 'error':
          subscriber.error(value.value);
          break;
        case 'next':
          subscriber.next(value.value);
          break;
        default:
          throw new Error(`Invalid Notification.name '${ value.name }'. Expected 'complete', 'error', or 'next'`);
      }
    } else {
      subscriber.next(value as T);
    }

  })
    .observe(observable);

  if (('complete' in observable) && IsObservable((observable as any).complete)) {
    const completeObserver = ((observable as any).complete as IObservable<void>)
      .pipeTo(() => {
        subscriber.complete();
        completeObserver.disconnect();
      });
    completeObserver.activate();
  }

  return new RXObservable<T>((_subscriber: Subscriber<T>) => {
    subscriber = _subscriber;
    observer.activate();

    return () => {
      observer.deactivate();
    };
  });
}

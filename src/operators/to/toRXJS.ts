import { Notification } from '../../notifications/core/notification/implementation';
import { IObservable } from '../../core/observable/interfaces';
import { Observer } from '../../core/observer/implementation';
import { Observable as RXObservable, Subscriber as RXSubscriber } from 'rxjs';
import { IObserver } from '../../core/observer/interfaces';
import { TValueOrNotificationType } from './toPromise';
import {
  TFiniteStateObservableFinalState, TFiniteStateObservableLikeNotifications
} from '../../notifications/observables/finite-state/types';


export function toRXJS<T>(observable: IObservable<TFiniteStateObservableLikeNotifications<T, TFiniteStateObservableFinalState>> | IObservable<T>): RXObservable<T> {
  let subscriber: RXSubscriber<T>;

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
      }
    } else {
      subscriber.next(value as T);
    }

  })
    .observe(observable);

  return new RXObservable<T>((_subscriber: RXSubscriber<T>) => {
    subscriber = _subscriber;
    observer.activate();

    return () => {
      observer.deactivate();
    };
  });
}

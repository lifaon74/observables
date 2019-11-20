import { INotification, INotificationConstructor } from './interfaces';
import { IEventLike } from '../../observables/events/events-listener/event-like/interfaces';
import { INotificationInternal, NOTIFICATION_PRIVATE } from './privates';
import { ConstructNotification } from './constructor';

/** METHODS **/

/* GETTERS/SETTERS */

export function NotificationGetName<TName extends string, TValue>(instance: INotification<TName, TValue>,): TName {
  return (instance as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].name;
}

export function NotificationGetValue<TName extends string, TValue>(instance: INotification<TName, TValue>,): TValue {
  return (instance as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].value;
}

/* METHODS */

export function NotificationToJSON<TName extends string, TValue>(instance: INotification<TName, TValue>,): Pick<INotification<TName, TValue>, 'name' | 'value'> {
  return {
    name: instance.name,
    value: instance.value,
  };
}

/* STATIC METHODS */

export function NotificationStaticFromEvent<TName extends string, TEvent extends IEventLike>(
  _constructor: INotificationConstructor,
  event: TEvent
): INotification<TName, TEvent> {
  return new _constructor<TName, TEvent>(event.type as TName, event);
}

/** CLASS **/

export class Notification<TName extends string, TValue> implements INotification<TName, TValue> {

  static fromEvent<TName extends string = string, TEvent extends IEventLike = IEventLike>(event: TEvent): INotification<TName, TEvent> {
    return NotificationStaticFromEvent<TName, TEvent>(this, event);
  }

  constructor(name: TName, value: TValue) {
    ConstructNotification<TName, TValue>(this, name, value);
  }

  get name(): TName {
    return NotificationGetName<TName, TValue>(this);
  }

  get value(): TValue {
    return NotificationGetValue<TName, TValue>(this);
  }

  toJSON(): Pick<INotification<TName, TValue>, 'name' | 'value'> {
    return NotificationToJSON<TName, TValue>(this);
  }
}

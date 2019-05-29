import { INotification } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';


export const NOTIFICATION_PRIVATE = Symbol('notification-private');

export interface INotificationPrivate<TName extends string, TValue> {
  name: TName;
  value: TValue;
}

export interface INotificationInternal<TName extends string, TValue> extends INotification<TName, TValue> {
  [NOTIFICATION_PRIVATE]: INotificationPrivate<TName, TValue>;
}

export function ConstructNotification<TName extends string, TValue>(notification: INotification<TName, TValue>, name: TName, value: TValue): void {
  ConstructClassWithPrivateMembers(notification, NOTIFICATION_PRIVATE);
  (notification as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].name = name;
  (notification as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].value = value;
}

export function IsNotification(value: any): value is INotification<string, any> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATION_PRIVATE);
}

export class Notification<TName extends string, TValue> implements INotification<TName, TValue> {

  static fromEvent<TName extends string = string, TEvent extends Event = Event>(event: TEvent): INotification<TName, TEvent> {
    return new Notification<TName, TEvent>(event.type as TName, event);
  }

  constructor(name: TName, value: TValue) {
    ConstructNotification<TName, TValue>(this, name, value);
  }

  get name(): TName {
    return ((this as unknown) as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].name;
  }

  get value(): TValue {
    return ((this as unknown) as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE].value;
  }

  toJSON(): INotification<TName, TValue> {
    return {
      name: this.name,
      value: this.value,
    } as INotification<TName, TValue>;
  }
}

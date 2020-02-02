import { INotification } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { INotificationInternal, INotificationPrivate, NOTIFICATION_PRIVATE } from './privates';
import { IsObject } from '../../../helpers';

/** CONSTRUCTOR **/

export function ConstructNotification<TName extends string, TValue>(instance: INotification<TName, TValue>, name: TName, value: TValue): void {
  ConstructClassWithPrivateMembers(instance, NOTIFICATION_PRIVATE);
  const privates: INotificationPrivate<TName, TValue> = (instance as INotificationInternal<TName, TValue>)[NOTIFICATION_PRIVATE];
  privates.name = name;
  privates.value = value;
}

export function IsNotification(value: any): value is INotification<string, any> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATION_PRIVATE as symbol);
}

import { IFromObservableBase, IFromObservableCompleteOptions } from '../interfaces';
import { Observable as RXObservable } from 'rxjs';
import {
  INotificationsObservable, INotificationsObservableBasicKeyValueMap, KeyValueMapToNotifications
} from '../../../notifications/core/notifications-observable/interfaces';

/** TYPES **/

export type TFromRXJSObservableConstructorArgs<TValue, TError> = [RXObservable<TValue>, IFromObservableCompleteOptions]
  | [RXObservable<TValue>];

export interface IFromRXJSObservableNotificationKeyValueMap<TValue, TError> extends INotificationsObservableBasicKeyValueMap<TValue, TError> {
}

export type TFromRXJSObservableNotifications<TValue, TError> = KeyValueMapToNotifications<IFromRXJSObservableNotificationKeyValueMap<TValue, TError>>;


/** INTERFACES **/

export interface IFromRXJSObservableConstructor {
  new<TValue, TError>(rxObservable: RXObservable<TValue>, onCompleteOptions?: IFromObservableCompleteOptions): IFromRXJSObservable<TValue, TError>;
}

export interface INotificationsFromObservable<TValue, TError> extends IFromObservableBase, INotificationsObservable<IFromRXJSObservableNotificationKeyValueMap<TValue, TError>> {
}

export interface IFromRXJSObservable<TValue, TError> extends INotificationsFromObservable<TValue, TError> {

}

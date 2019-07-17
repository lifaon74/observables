import { Observable as RXObservable } from 'rxjs';
import {
  ICompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable, ICompleteStateObservableOptions
} from '../../interfaces';
import { KeyValueMapToNotifications } from '../../../../core/notifications-observable/interfaces';

/** TYPES **/

export type FromRXJSObservableKeyValueMap<T> = ICompleteStateObservableKeyValueMapGeneric<T>;
export type TFromRXJSObservableNotifications<T> = KeyValueMapToNotifications<FromRXJSObservableKeyValueMap<T>>;

export interface IFromRXJSObservableOptions extends ICompleteStateObservableOptions {
}

export type TFromRXJSObservableConstructorArgs<T> = [RXObservable<T>, IFromRXJSObservableOptions?];

/** INTERFACES **/

export interface IFromRXJSObservableConstructor {
  new<T>(rxObservable: RXObservable<T>, options?: IFromRXJSObservableOptions): IFromRXJSObservable<T>;
}

export interface IFromRXJSObservable<T> extends ICompleteStateObservable<T, FromRXJSObservableKeyValueMap<T>> {
}

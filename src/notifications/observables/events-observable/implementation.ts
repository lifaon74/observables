import { INotificationsObservableInternal, NotificationsObservable } from '../../core/notifications-observable/implementation';
import { EventKeyValueMapConstraint, IEventsObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { Notification } from '../../core/notification/implementation';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/implementation';
import { KeyValueMapKeys, KeyValueMapValues } from '../../core/interfaces';
import {
  KeyValueMapToNotifications, KeyValueMapToNotificationsObserversLikeGeneric,
  TNotificationsObservableHook,
} from '../../core/notifications-observable/interfaces';
import {IObserver} from "../../../core/observer/interfaces";
import { IsObject } from '../../../helpers';


export const EVENTS_OBSERVABLE_PRIVATE = Symbol('events-observable-private');

export interface IEventsObservablePrivate<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget> {
  target: TTarget;
  name: KeyValueMapKeys<TKVMap> | null;
  observerListenerMap: WeakMap<KeyValueMapToNotifications<TKVMap>, (event: KeyValueMapValues<TKVMap>) => void>;
}

export interface IEventsObservableInternal<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget> extends IEventsObservable<TKVMap, TTarget>, INotificationsObservableInternal<TKVMap> {
  [EVENTS_OBSERVABLE_PRIVATE]: IEventsObservablePrivate<TKVMap, TTarget>;
}

export function ConstructEventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, target: TTarget, name: KeyValueMapKeys<TKVMap> | null): void {
  ConstructClassWithPrivateMembers(observable, EVENTS_OBSERVABLE_PRIVATE);
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target = target;
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name = name;
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap = new WeakMap<KeyValueMapToNotifications<TKVMap>, (event: KeyValueMapValues<TKVMap>) => void>();
}

export function IsEventsObservable(value: any): value is IEventsObservable<any> {
  return IsObject(value)
    && (EVENTS_OBSERVABLE_PRIVATE in value);
}



export function HandleEventsObservableOnObserved<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const name:  KeyValueMapKeys<TKVMap> | null = (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot observe an EventObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      const listener = (event: KeyValueMapValues<TKVMap>) => {
        observer.emit(new Notification<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(name, event) as unknown as KeyValueMapToNotifications<TKVMap>);
      };
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.set(observer as any, listener);
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target.addEventListener(name, listener);
    }
  } else {
    if ((name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot observe an EventObservable (${name}), with a NotificationsObserver having a different name (${nameAndCallback.name}).`);
    } else {
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target.addEventListener(
        nameAndCallback.name,
        nameAndCallback.callback
      );
    }
  }
}

export function HandleEventsObservableOnUnobserved<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const name: KeyValueMapKeys<TKVMap> | null = (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot unobserve an EventObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target.removeEventListener(
        name,
        (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.get(observer as any)
      );
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.delete(observer as any);
    }
  } else {
    if ((name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot unobserve an EventObservable (${name}), with a NotificationsObserver having a different name (${nameAndCallback.name}).`);
    } else {
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target.removeEventListener(
        nameAndCallback.name,
        nameAndCallback.callback
      );
    }
  }
}


/**
 * An EventObservable links an EventTarget with an NotificationsObservable.
 *  When a listened event occurs (ex: though "addListener"), a Notification is dispatched.
 * @Example:
 *  const mouseMoveListener = new EventObservable(window)
 *    .addListener<MouseEvent>('mousemove', (event: MouseEvent) => {
 *      console.log(event.clientX);
 *    }).activate();
 */
export class EventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends EventTarget = EventTarget> extends NotificationsObservable<TKVMap> implements IEventsObservable<TKVMap, TTarget> {

  constructor(target: TTarget, name: KeyValueMapKeys<TKVMap> | null = null) {
    super((): TNotificationsObservableHook<TKVMap> => {
      return {
        onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          HandleEventsObservableOnObserved<TKVMap, TTarget>(this, observer);
        },
        onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          HandleEventsObservableOnUnobserved<TKVMap, TTarget>(this, observer);
        }
      }
    });
    ConstructEventsObservable<TKVMap, TTarget>(this, target, name);
  }

  get target(): TTarget {
    return ((this as unknown) as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target;
  }

  get name(): KeyValueMapKeys<TKVMap> | null {
    return ((this as unknown) as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  }
}


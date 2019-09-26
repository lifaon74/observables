import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../../core/notifications-observable/implementation';
import { EventKeyValueMapConstraint, IEventsObservable, PureEventTarget } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { Notification } from '../../../core/notification/implementation';
import { ExtractObserverNameAndCallback } from '../../../core/notifications-observer/implementation';
import { KeyValueMapKeys, KeyValueMapValues } from '../../../core/interfaces';
import {
  KeyValueMapToNotifications, KeyValueMapToNotificationsObserversLikeGeneric, TNotificationsObservableHook,
} from '../../../core/notifications-observable/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { IsObject } from '../../../../helpers';


export const EVENTS_OBSERVABLE_PRIVATE = Symbol('events-observable-private');

export interface IEventsObservablePrivate<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget> {
  target: TTarget;
  name: KeyValueMapKeys<TKVMap> | null;
  observerListenerMap: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>;
}

export interface IEventsObservableInternal<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget> extends IEventsObservable<TKVMap, TTarget>, INotificationsObservableInternal<TKVMap> {
  [EVENTS_OBSERVABLE_PRIVATE]: IEventsObservablePrivate<TKVMap, TTarget>;
}

export function ConstructEventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget>(
  instance: IEventsObservable<TKVMap, TTarget>,
  target: TTarget,
  name: KeyValueMapKeys<TKVMap> | null
): void {
  ConstructClassWithPrivateMembers(instance, EVENTS_OBSERVABLE_PRIVATE);
  const privates: IEventsObservablePrivate<TKVMap, TTarget> = (instance as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE];
  privates.target = target;
  privates.name = name;
  privates.observerListenerMap = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>();
}

export function IsEventsObservable(value: any): value is IEventsObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(EVENTS_OBSERVABLE_PRIVATE as symbol);
}


export function EventsObservableOnObserved<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget>(instance: IEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: IEventsObservablePrivate<TKVMap, TTarget> = (instance as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE];
  const name: KeyValueMapKeys<TKVMap> | null = privates.name;
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot observe an EventsObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      const listener = (event: Event) => {
        observer.emit(new Notification<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(name, event as KeyValueMapValues<TKVMap>) as KeyValueMapToNotifications<TKVMap>);
      };
      privates.observerListenerMap.set(observer, listener);
      privates.target.addEventListener(name, listener);
    }
  } else {
    if ((privates.name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot observe an EventsObservable (${ name }), with a NotificationsObserver having a different name (${ nameAndCallback.name }).`);
    } else {
      privates.target.addEventListener(
        nameAndCallback.name,
        nameAndCallback.callback as ((event: Event) => void)
      );
    }
  }
}

export function EventsObservableOnUnobserved<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget>(instance: IEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: IEventsObservablePrivate<TKVMap, TTarget> = (instance as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE];
  const name: KeyValueMapKeys<TKVMap> | null = privates.name;
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot unobserve an EventsObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      privates.target.removeEventListener(
        name,
        privates.observerListenerMap.get(observer) as (event: Event) => void
      );
      privates.observerListenerMap.delete(observer);
    }
  } else {
    if ((name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot unobserve an EventsObservable (${ name }), with a NotificationsObserver having a different name (${ nameAndCallback.name }).`);
    } else {
      privates.target.removeEventListener(
        nameAndCallback.name,
        nameAndCallback.callback as ((event: Event) => void)
      );
    }
  }
}


/**
 * An EventsObservable links an EventTarget with a NotificationsObservable.
 *  When a listened event occurs (ex: though "addListener"), a Notification is dispatched.
 * @Example:
 *  const mouseMoveListener = new EventsObservable(window)
 *    .addListener<MouseEvent>('mousemove', (event: MouseEvent) => {
 *      console.log(event.clientX);
 *    }).activate();
 */
export class EventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget = PureEventTarget> extends NotificationsObservable<TKVMap> implements IEventsObservable<TKVMap, TTarget> {

  constructor(target: TTarget, name: KeyValueMapKeys<TKVMap> | null = null) {
    super((): TNotificationsObservableHook<TKVMap> => {
      return {
        onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          EventsObservableOnObserved<TKVMap, TTarget>(this, observer);
        },
        onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          EventsObservableOnUnobserved<TKVMap, TTarget>(this, observer);
        }
      };
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


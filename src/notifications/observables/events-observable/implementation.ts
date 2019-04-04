import { INotificationsObservableInternal, NotificationsObservable } from '../../core/notifications-observable/implementation';
import { EventKeyValueMap, IEventsObservable, IEventsObservableKeyValueMapDefault } from './interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { Notification } from '../../core/notification/implementation';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/implementation';
import { IObservableHook } from '../../../core/observable/interfaces';
import { KeyValueMapKeys, KeyValueMapValues } from '../../core/interfaces';
import { INotification } from '../../core/notification/interfaces';
import { INotificationsObserverLike } from '../../core/notifications-observer/interfaces';


export const EVENTS_OBSERVABLE_PRIVATE = Symbol('events-observable-private');

export interface IEventsObservablePrivate<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget> {
  target: TTarget;
  name: KeyValueMapKeys<TKVMap> | null;
  observerListenerMap: WeakMap<IObserver<INotification<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>;
}

export interface IEventsObservableInternal<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget> extends IEventsObservable<TKVMap, TTarget>, INotificationsObservableInternal<TKVMap> {
  [EVENTS_OBSERVABLE_PRIVATE]: IEventsObservablePrivate<TKVMap, TTarget>;
}

export function ConstructEventsObservablePrivates<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, target: TTarget, name: KeyValueMapKeys<TKVMap> | null): void {
  ConstructClassWithPrivateMembers(observable, EVENTS_OBSERVABLE_PRIVATE);
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target = target;
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name = name;
  (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap = new WeakMap<IObserver<INotification<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>();
}

// export function CreateCallbackEventsObservable<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>) {
//   return () => {
//     return {
//       onObserved: (observer: IObserver<TKVNotification<TKVMap>>) => {
//         HandleEventsObservableOnObserved<TKVMap, TTarget>(observable, observer);
//       },
//       onUnobserved: (observer: IObserver<TKVNotification<TKVMap>>) => {
//         HandleEventsObservableOnUnobserved<TKVMap, TTarget>(observable, observer);
//       }
//     }
//   };
// }



export function HandleEventsObservableOnObserved<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, observer: IObserver<INotification<TKVMap>>): void {
  const name:  KeyValueMapKeys<TKVMap> | null = (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  const nameAndCallback: INotificationsObserverLike<TKVMap> | null = ExtractObserverNameAndCallback<TKVMap>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot observe an EventObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      const listener = (event: KeyValueMapValues<TKVMap>) => {
        observer.emit(new Notification<TKVMap>(name, event));
      };
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.set(observer, listener);
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

export function HandleEventsObservableOnUnobserved<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends EventTarget>(observable: IEventsObservable<TKVMap, TTarget>, observer: IObserver<INotification<TKVMap>>): void {
  const name: KeyValueMapKeys<TKVMap> | null = (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  const nameAndCallback: INotificationsObserverLike<TKVMap> | null = ExtractObserverNameAndCallback<TKVMap>(observer);
  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot unobserve an EventObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target.removeEventListener(
        name,
        (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.get(observer)
      );
      (observable as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].observerListenerMap.delete(observer);
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
export class EventsObservable<TKVMap extends EventKeyValueMap<TKVMap> = IEventsObservableKeyValueMapDefault, TTarget extends EventTarget = EventTarget> extends NotificationsObservable<TKVMap> implements IEventsObservable<TKVMap, TTarget> {

  constructor(target: TTarget, name: KeyValueMapKeys<TKVMap> | null = null) {
    super((): IObservableHook<INotification<TKVMap>> => {
      return {
        onObserved: (observer: IObserver<INotification<TKVMap>>) => {
          HandleEventsObservableOnObserved<TKVMap, TTarget>(this, observer);
        },
        onUnobserved: (observer: IObserver<INotification<TKVMap>>) => {
          HandleEventsObservableOnUnobserved<TKVMap, TTarget>(this, observer);
        }
      }
    });
    ConstructEventsObservablePrivates<TKVMap, TTarget>(this, target, name);
  }

  get target(): TTarget {
    return ((this as unknown) as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].target;
  }

  get name(): KeyValueMapKeys<TKVMap> | null {
    return ((this as unknown) as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE].name;
  }
}


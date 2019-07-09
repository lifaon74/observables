import {
  INotificationsObservableInternal, NotificationsObservable
} from '../../core/notifications-observable/implementation';
import { INodeJSEventsObservable, NodeJSEventKeyValueMapConstraint, PureNodeJSEventTarget } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { Notification } from '../../core/notification/implementation';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/implementation';
import { KeyValueMapKeys, KeyValueMapValues } from '../../core/interfaces';
import {
  KeyValueMapToNotifications, KeyValueMapToNotificationsObserversLikeGeneric, TNotificationsObservableHook,
} from '../../core/notifications-observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { IsObject } from '../../../helpers';


export const NODE_JS_EVENTS_OBSERVABLE_PRIVATE = Symbol('node-js-events-observable-private');

export interface INodeJSEventsObservablePrivate<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget> {
  target: TTarget;
  name: KeyValueMapKeys<TKVMap> | null;
  observerListenerMap: WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>;
}

export interface INodeJSEventsObservableInternal<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget> extends INodeJSEventsObservable<TKVMap, TTarget>, INotificationsObservableInternal<TKVMap> {
  [NODE_JS_EVENTS_OBSERVABLE_PRIVATE]: INodeJSEventsObservablePrivate<TKVMap, TTarget>;
}

export function ConstructNodeJSEventsObservable<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget>(instance: INodeJSEventsObservable<TKVMap, TTarget>, target: TTarget, name: KeyValueMapKeys<TKVMap> | null): void {
  ConstructClassWithPrivateMembers(instance, NODE_JS_EVENTS_OBSERVABLE_PRIVATE);
  const privates: INodeJSEventsObservablePrivate<TKVMap, TTarget> = (instance as INodeJSEventsObservableInternal<TKVMap, TTarget>)[NODE_JS_EVENTS_OBSERVABLE_PRIVATE];
  privates.target = target;
  privates.name = name;
  privates.observerListenerMap = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>();
}

export function IsNodeJSEventsObservable(value: any): value is INodeJSEventsObservable<any> {
  return IsObject(value)
    && (NODE_JS_EVENTS_OBSERVABLE_PRIVATE in value);
}

export function NormalizeNodeJSListenerValue(args: any[]): any {
  return (args.length === 0)
    ? void 0
    : (args.length === 1)
      ? args[0]
      : args;
}

export function NodeJSEventsObservableOnObserved<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget>(instance: INodeJSEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INodeJSEventsObservablePrivate<TKVMap, TTarget> = (instance as INodeJSEventsObservableInternal<TKVMap, TTarget>)[NODE_JS_EVENTS_OBSERVABLE_PRIVATE];
  const name: KeyValueMapKeys<TKVMap> | null = privates.name;
  let nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);

  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot observe an NodeJSEventsObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      nameAndCallback = {
        name: name,
        callback: (value: KeyValueMapValues<TKVMap>) => {
          observer.emit(new Notification<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(name, value) as KeyValueMapToNotifications<TKVMap>);
        }
      };
    }
  } else {
    if ((name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot observe an NodeJSEventsObservable (${ name }), with a NotificationsObserver having a different name (${ nameAndCallback.name }).`);
    }
  }

  const listener = (...args: any[]) => {
    (nameAndCallback as KeyValueMapToNotificationsObserversLikeGeneric<TKVMap>).callback(NormalizeNodeJSListenerValue(args) as KeyValueMapValues<TKVMap>);
  };

  privates.observerListenerMap.set(observer, listener);
  privates.target.addListener(nameAndCallback.name, listener);
}

export function NodeJSEventsObservableOnUnobserved<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget>(instance: INodeJSEventsObservable<TKVMap, TTarget>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INodeJSEventsObservablePrivate<TKVMap, TTarget> = (instance as INodeJSEventsObservableInternal<TKVMap, TTarget>)[NODE_JS_EVENTS_OBSERVABLE_PRIVATE];
  const name: KeyValueMapKeys<TKVMap> | null = privates.name;
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<TKVMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(observer);

  let _name: string;

  if (nameAndCallback === null) {
    if (name === null) {
      throw new TypeError(`Cannot unobserve an NodeJSEventsObservable without a name (null), with a standard Observer (use a NotificationsObserver instead).`);
    } else {
      _name = name;
    }
  } else {
    if ((name !== null) && (nameAndCallback.name !== name)) {
      throw new TypeError(`Cannot unobserve an NodeJSEventsObservable (${ name }), with a NotificationsObserver having a different name (${ nameAndCallback.name }).`);
    } else {
      _name = nameAndCallback.name;
    }
  }

  privates.target.removeListener(
    _name,
    privates.observerListenerMap.get(observer) as (event: KeyValueMapValues<TKVMap>) => void
  );
  privates.observerListenerMap.delete(observer);
}


/**
 * An NodeJSEventsObservable links an PureNodeJSEventTarget with an NotificationsObservable.
 *  When a listened event occurs (ex: though "addListener"), a Notification is dispatched.
 * @Example:
 *  const listener = new NodeJSEventsObservable(stream)
 *    .addListener<Buffer>('data', (data: Buffer) => {
 *      console.log(data);
 *    }).activate();
 */
export class NodeJSEventsObservable<TKVMap extends NodeJSEventKeyValueMapConstraint<TKVMap>, TTarget extends PureNodeJSEventTarget = PureNodeJSEventTarget> extends NotificationsObservable<TKVMap> implements INodeJSEventsObservable<TKVMap, TTarget> {

  constructor(target: TTarget, name: KeyValueMapKeys<TKVMap> | null = null) {
    super((): TNotificationsObservableHook<TKVMap> => {
      return {
        onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          NodeJSEventsObservableOnObserved<TKVMap, TTarget>(this, observer);
        },
        onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>) => {
          NodeJSEventsObservableOnUnobserved<TKVMap, TTarget>(this, observer);
        }
      };
    });
    ConstructNodeJSEventsObservable<TKVMap, TTarget>(this, target, name);
  }

  get target(): TTarget {
    return ((this as unknown) as INodeJSEventsObservableInternal<TKVMap, TTarget>)[NODE_JS_EVENTS_OBSERVABLE_PRIVATE].target;
  }

  get name(): KeyValueMapKeys<TKVMap> | null {
    return ((this as unknown) as INodeJSEventsObservableInternal<TKVMap, TTarget>)[NODE_JS_EVENTS_OBSERVABLE_PRIVATE].name;
  }
}


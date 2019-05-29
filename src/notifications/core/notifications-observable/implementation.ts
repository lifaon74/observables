import { Notification } from '../notification/implementation';
import {
  INotificationsObservable, INotificationsObservableConstructor, INotificationsObservableContext,
  INotificationsObservableContextConstructor, KeyValueMapToNotifications, KeyValueMapToNotificationsObservers,
  TNotificationsObservableConstructorArgs, TNotificationsObservableHook,
} from './interfaces';
import {
  AllowObservableContextBaseConstruct, IObservableContextBaseInternal, IObservablePrivate,
  IS_OBSERVABLE_LIKE_CONSTRUCTOR, IsObservableLikeConstructor, OBSERVABLE_CONTEXT_BASE_PRIVATE, OBSERVABLE_PRIVATE,
  ObservableContextBase, ObservableFactory
} from '../../../core/observable/implementation';
import { IObservable, IObservableConstructor, IObservableContext } from '../../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import {
  INotificationsObserverInternal, NOTIFICATIONS_OBSERVER_PRIVATE, NotificationsObserver
} from '../notifications-observer/implementation';
import { IObserverInternal, OBSERVER_PRIVATE, ObserverUnobserveOne } from '../../../core/observer/implementation';
import { INotification } from '../notification/interfaces';
import { KeyValueMapGeneric, KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';
import { InitObservableHook, IObservableHookPrivate } from '../../../core/observable/hook';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/factory';
import { IsObject } from '../../../helpers';
import { IObserver } from '../../../core/observer/interfaces';


export const NOTIFICATIONS_OBSERVABLE_PRIVATE = Symbol('notifications-observable-private');

export interface INotificationsObservablePrivate<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends IObservableHookPrivate<KeyValueMapToNotifications<TKVMap>> {
  context: IObservableContext<KeyValueMapToNotifications<TKVMap>>;
  observersMap: Map<KeyValueMapKeys<TKVMap>, KeyValueMapToNotificationsObservers<TKVMap>[]>; // map from a name to a list of observers
  othersObservers: IObserver<KeyValueMapToNotifications<TKVMap>>[]; // observers which are not of type NotificationsObserver
}

export interface INotificationsObservableInternal<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends INotificationsObservable<TKVMap> {
  [OBSERVABLE_PRIVATE]: IObservablePrivate<KeyValueMapToNotifications<TKVMap>>;
  [NOTIFICATIONS_OBSERVABLE_PRIVATE]: INotificationsObservablePrivate<TKVMap>;
}

export type TKVNotificationsObserverInternal<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = INotificationsObserverInternal<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;


/**
 * Constructs a NotificationsObservable
 * @param observable
 * @param context
 * @param create
 */
export function ConstructNotificationsObservable<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  observable: INotificationsObservable<TKVMap>,
  context: IObservableContext<KeyValueMapToNotifications<TKVMap>>,
  create?: (context: INotificationsObservableContext<TKVMap>) => TNotificationsObservableHook<TKVMap> | void
): void {
  ConstructClassWithPrivateMembers(observable, NOTIFICATIONS_OBSERVABLE_PRIVATE);
  InitObservableHook(
    observable,
    (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE],
    NewNotificationsObservableContext,
    create,
  );
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].context = context;
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap = new Map<KeyValueMapKeys<TKVMap>, KeyValueMapToNotificationsObservers<TKVMap>[]>();
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers = [];
}

export function IsNotificationsObservable(value: any): value is INotificationsObservable<KeyValueMapGeneric> {
  return IsObject(value)
    && value.hasOwnProperty(NOTIFICATIONS_OBSERVABLE_PRIVATE as symbol);
}

const IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR = Symbol('is-notifications-observable-constructor');

export function IsNotificationsObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, direct);
}


/**
 * Called when an Observer observes a NotificationsObservable.
 * Registers the observer into 'observersMap' or 'othersObservers'
 * @param observable
 * @param observer
 */
export function NotificationsObservableOnObserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (observer instanceof NotificationsObserver) {
    const name: KeyValueMapKeys<TKVMap> = ((observer as unknown) as TKVNotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
    if (!privates.observersMap.has(name)) {
      privates.observersMap.set(name, []);
    }
    (privates.observersMap.get(name) as KeyValueMapToNotificationsObservers<TKVMap>[]).push((observer as unknown) as KeyValueMapToNotificationsObservers<TKVMap>);
  } else {
    privates.othersObservers.push(observer);
  }
  privates.onObserveHook(observer);
}

/**
 * Called when an Observer stops observing a NotificationsObservable.
 * Unregisters the observer into 'observersMap' or 'othersObservers'
 * @param observable
 * @param observer
 */
export function NotificationsObservableOnUnobserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (observer instanceof NotificationsObserver) {
    const name: KeyValueMapKeys<TKVMap> = ((observer as unknown) as TKVNotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name;
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = privates.observersMap.get(name) as KeyValueMapToNotificationsObservers<TKVMap>[];
    observers.splice(observers.indexOf((observer as unknown) as KeyValueMapToNotificationsObservers<TKVMap>), 1);
    if (observers.length === 0) {
      privates.observersMap.delete(name);
    }
  } else {
    privates.othersObservers.splice(
      privates.othersObservers.indexOf(observer),
      1
    );
  }
  privates.onUnobserveHook(observer);
}


/**
 * Removes the NotificationsObservers matching 'name' and 'callback' observing 'observable'
 * @param observable
 * @param name
 * @param callback
 */
export function NotificationsObservableRemoveListener<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(observable: INotificationsObservable<TKVMap>, name: K, callback?: (value: TKVMap[K]) => void): void {
  const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = Array.from(NotificationsObservableMatches<TKVMap>(observable, name, callback)); // clone the list before removing
  for (let i = 0, l = observers.length; i < l; i++) {
    ObserverUnobserveOne<KeyValueMapToNotifications<TKVMap>>((observers[i] as unknown) as any, observable);
  }
}

/**
 * Returns an Iterator over the list of NotificationsObservers matching 'name' and 'callback'
 * @param observable
 * @param name
 * @param callback
 */
export function * NotificationsObservableMatches<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>, name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<TKVMap>> {
  if ((observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[];
    if (callback === void 0) {
      for (let i = 0, l = observers.length; i < l; i++) {
        yield observers[i];
      }
    } else {
      for (let i = 0, l = observers.length; i < l; i++) {
        if (((observers[i] as unknown) as TKVNotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback === callback) {
          yield observers[i];
        }
      }
    }
  }
}


/**
 * Dispatches a Notification with 'name' and 'value' for all the observers observing this observable
 * @param observable
 * @param name
 * @param value
 * @param notification
 */
export function NotificationsObservableDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(observable: INotificationsObservable<TKVMap>, name: K, value: TKVMap[K], notification?: INotification<K, TKVMap[K]>): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (privates.observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = (privates.observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[]).slice(0);
    for (let i = 0, l = observers.length; i < l; i++) {
      ((observers[i] as unknown) as TKVNotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback(value);
    }
  }

  const length: number = privates.othersObservers.length;
  if (length > 0) {
    if (notification === void 0) {
      notification = new Notification<K, TKVMap[K]>(name, value);
    }
    for (let i = 0; i < length; i++) {
      ((privates.othersObservers[i] as unknown) as IObserverInternal<INotification<K, TKVMap[K]>>)[OBSERVER_PRIVATE].onEmit(notification, (observable as unknown) as IObservable<INotification<K, TKVMap[K]>>);
    }
  }
}


function PureNotificationsObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  // type TKVMap = never; // dirty hack
  type TKVMap = { [key: string]: any };
  // type TKVMap = KeyValueMapGeneric;
  if (!IsObservableLikeConstructor(superClass)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class NotificationsObservable extends superClass implements INotificationsObservable<TKVMap> {
    constructor(...args: any[]) {
      const [create]: TNotificationsObservableConstructorArgs<TKVMap> = args[0];
      // const [create]: ConstructorParameters<INotificationsObservableConstructor> = args[0];

      let context: IObservableContext<KeyValueMapToNotifications<TKVMap>>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IObservableContext<KeyValueMapToNotifications<TKVMap>>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              NotificationsObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              NotificationsObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      // @ts-ignore
      ConstructNotificationsObservable<TKVMap>(this, context, create);
    }

    addListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<K, TKVMap[K]> {
      return new NotificationsObserver<K, TKVMap[K]>(name, callback).observe(this);
    }

    removeListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): void {
      NotificationsObservableRemoveListener<TKVMap, K>(this, name, callback);
    }

    on<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): this {
      this.addListener(name, callback).activate();
      return this;
    }

    off<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): this {
      this.removeListener(name, callback);
      return this;
    }

    matches(name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<TKVMap>> {
      return NotificationsObservableMatches<TKVMap>(this, name, callback);
    }
  };
}

export let NotificationsObservable: INotificationsObservableConstructor;

export function NotificationsObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  return MakeFactory<INotificationsObservableConstructor, [], TBase>(PureNotificationsObservableFactory, [], superClass, {
    name: 'NotificationsObservable',
    instanceOf: NotificationsObservable,
    waterMarks: [IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function NotificationsObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<INotificationsObservableConstructor, [IObservableConstructor], TBase>(PureNotificationsObservableFactory, [ObservableFactory], superClass, {
    name: 'NotificationsObservable',
    instanceOf: NotificationsObservable,
    waterMarks: [IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

NotificationsObservable = class NotificationsObservable extends NotificationsObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(create?: (context: INotificationsObservableContext<KeyValueMapGeneric>) => (TNotificationsObservableHook<KeyValueMapGeneric> | void)) {
    // constructor(create?: any) {
    super([create], []);
  }
} as INotificationsObservableConstructor;


/* ------------------------------------------- */


export function NewNotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(observable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: INotificationsObservableContext<TKVMap> = new ((NotificationsObservableContext as any) as INotificationsObservableContextConstructor)<TKVMap>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function NotificationsObservableContextEmit<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(context: INotificationsObservableContext<TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  NotificationsObservableDispatch<TKVMap, KeyValueMapKeys<TKVMap>>(((context as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, notification.name as KeyValueMapKeys<TKVMap>, notification.value as KeyValueMapValues<TKVMap>, notification);
}

export function NotificationsObservableContextDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(context: INotificationsObservableContext<TKVMap>, name: K, value: TKVMap[K]): void {
  NotificationsObservableDispatch<TKVMap, K>(((context as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, name, value);
}

export class NotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends ObservableContextBase<KeyValueMapToNotifications<TKVMap>> implements INotificationsObservableContext<TKVMap> {
  protected constructor(observable: INotificationsObservable<TKVMap>) {
    super(observable);
  }

  get observable(): INotificationsObservable<TKVMap> {
    return ((this as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    NotificationsObservableContextEmit<TKVMap>(this, value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    NotificationsObservableContextDispatch<TKVMap, K>(this, name, value);
    // this.emit(new Notification<TKVMap>(name, value));
  }

}

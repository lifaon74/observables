import { Notification } from '../notification/implementation';
import {
  INotificationsObservable, INotificationsObservableConstructor, INotificationsObservableContext,
  INotificationsObservableContextConstructor, INotificationsObservableMatchOptions, KeyValueMapToNotifications,
  KeyValueMapToNotificationsObservers,
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
  NotificationsObserver
} from '../notifications-observer/implementation';
import { IObserverInternal, OBSERVER_PRIVATE, ObserverUnobserveOne } from '../../../core/observer/implementation';
import { INotification } from '../notification/interfaces';
import { KeyValueMapGeneric, KeyValueMapGenericConstraint, KeyValueMapKeys, KeyValueMapValues } from '../interfaces';
import { InitObservableHook, IObservableHookPrivate } from '../../../core/observable/hook';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/class-helpers/factory';
import { IsObject } from '../../../helpers';
import { IObserver } from '../../../core/observer/interfaces';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';


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

// export type TKVNotificationsObserverInternal<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> = INotificationsObserverInternal<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>;


/**
 * Constructs a NotificationsObservable
 * @param instance
 * @param context
 * @param create
 */
export function ConstructNotificationsObservable<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  context: IObservableContext<KeyValueMapToNotifications<TKVMap>>,
  create?: (context: INotificationsObservableContext<TKVMap>) => TNotificationsObservableHook<TKVMap> | void
): void {
  ConstructClassWithPrivateMembers(instance, NOTIFICATIONS_OBSERVABLE_PRIVATE);
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  privates.context = context;
  privates.observersMap = new Map<KeyValueMapKeys<TKVMap>, KeyValueMapToNotificationsObservers<TKVMap>[]>();
  privates.othersObservers = [];

  InitObservableHook(
    instance,
    privates,
    NewNotificationsObservableContext,
    create,
  );
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
 * @param instance
 * @param observer
 */
export function NotificationsObservableOnObserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(instance: INotificationsObservable<TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (observer instanceof NotificationsObserver) {
    const name: KeyValueMapKeys<TKVMap> = observer.name;
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
 * @param instance
 * @param observer
 */
export function NotificationsObservableOnUnobserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(instance: INotificationsObservable<TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (observer instanceof NotificationsObserver) {
    const name: KeyValueMapKeys<TKVMap> = observer.name;
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
 * Removes the NotificationsObservers matching 'name' and 'callback' observing 'instance'
 * @param instance
 * @param name
 * @param callback
 */
export function NotificationsObservableRemoveListener<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(instance: INotificationsObservable<TKVMap>, name: K, callback?: (value: TKVMap[K]) => void): void {
  const observers: IObserver<KeyValueMapToNotifications<TKVMap>>[] = Array.from(NotificationsObservableMatches<TKVMap>(instance, name, callback)); // clone the list before removing
  for (let i = 0, l = observers.length; i < l; i++) {
    ObserverUnobserveOne<KeyValueMapToNotifications<TKVMap>>((observers[i] as unknown) as any, instance);
  }
}


export type INotificationsObservableMatchOptionStrict = Required<INotificationsObservableMatchOptions>;

export function NormalizeNotificationsObservableMatchOptions(options: INotificationsObservableMatchOptions = {}): INotificationsObservableMatchOptionStrict {
  if (IsObject(options)) {
    const _options: INotificationsObservableMatchOptionStrict = {} as INotificationsObservableMatchOptionStrict;

    _options.includeGlobalObservers = Boolean(options.includeGlobalObservers);

    return  _options;
  } else {
    throw new TypeError(`Expected object or void as options`);
  }

}

export function NotificationsObservableHasListener<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: string,
  callback?: (value: any) => void,
  options?: INotificationsObservableMatchOptions,
): boolean {
  const _options: INotificationsObservableMatchOptionStrict = NormalizeNotificationsObservableMatchOptions(options);
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (
    _options.includeGlobalObservers
    && (privates.othersObservers.length > 0)
  ) {
    return true;
  } else if (privates.observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = privates.observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[];
    if (callback === void 0) {
      return observers.length > 0;
    } else {
      for (let i = 0, l = observers.length; i < l; i++) {
        if (observers[i].callback === callback) {
          return true;
        }
      }
      return false;
    }
  } else {
    return false;
  }
}

/**
 * Returns an Iterator over the list of NotificationsObservers matching 'name' and 'callback'
 * @param instance
 * @param name
 * @param callback
 * @param options
 */
export function * NotificationsObservableMatches<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: string,
  callback?: (value: any) => void,
  options?: INotificationsObservableMatchOptions,
): IterableIterator<IObserver<KeyValueMapToNotifications<TKVMap>>> {
  const _options: INotificationsObservableMatchOptionStrict = NormalizeNotificationsObservableMatchOptions(options);
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (privates.observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = privates.observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[];
    if (callback === void 0) {
      yield * observers as unknown as IObserver<KeyValueMapToNotifications<TKVMap>>[];
    } else {
      for (let i = 0, l = observers.length; i < l; i++) {
        if (observers[i].callback === callback) {
          yield observers[i] as unknown as IObserver<KeyValueMapToNotifications<TKVMap>>;
        }
      }
    }
  }

  if (_options.includeGlobalObservers) {
    yield * privates.othersObservers;
  }
}


/**
 * Dispatches a Notification with 'name' and 'value' for all the observers observing this instance
 * @param instance
 * @param name
 * @param value
 * @param notification
 */
export function NotificationsObservableDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: K,
  value: TKVMap[K],
  notification?: INotification<K, TKVMap[K]>
): void {
  const privates: INotificationsObservablePrivate<TKVMap> = (instance as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE];

  if (privates.observersMap.has(name as KeyValueMapKeys<TKVMap>)) {
    const observers: KeyValueMapToNotificationsObservers<TKVMap>[] = (privates.observersMap.get(name as KeyValueMapKeys<TKVMap>) as KeyValueMapToNotificationsObservers<TKVMap>[]).slice(0);
    for (let i = 0, l = observers.length; i < l; i++) {
      observers[i].callback(value);
    }
  }

  const length: number = privates.othersObservers.length;
  if (length > 0) {
    if (notification === void 0) {
      notification = new Notification<K, TKVMap[K]>(name, value);
    }
    for (let i = 0; i < length; i++) {
      ((privates.othersObservers[i] as unknown) as IObserverInternal<INotification<K, TKVMap[K]>>)[OBSERVER_PRIVATE].onEmit(notification, (instance as unknown) as IObservable<INotification<K, TKVMap[K]>>);
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

    hasListener(
      name: string,
      callback?: (value: any) => void,
      options?: INotificationsObservableMatchOptions
    ): boolean {
      return NotificationsObservableHasListener<TKVMap>(this, name, callback, options);
    }

    matches(
      name: string,
      callback?: (value: any) => void,
      options?: INotificationsObservableMatchOptions
    ): IterableIterator<IObserver<KeyValueMapToNotifications<TKVMap>>> {
      return NotificationsObservableMatches<TKVMap>(this, name, callback, options);
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

NotificationsObservable = class NotificationsObservable extends NotificationsObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: INotificationsObservableContext<KeyValueMapGeneric>) => (TNotificationsObservableHook<KeyValueMapGeneric> | void)) {
    super([create], []);
  }
} as INotificationsObservableConstructor;


/* ------------------------------------------- */


export function NewNotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(notificationsObservable: INotificationsObservable<TKVMap>): INotificationsObservableContext<TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: INotificationsObservableContext<TKVMap> = new (NotificationsObservableContext as INotificationsObservableContextConstructor)<TKVMap>(notificationsObservable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function NotificationsObservableContextEmit<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(instance: INotificationsObservableContext<TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  NotificationsObservableDispatch<TKVMap, KeyValueMapKeys<TKVMap>>(
    ((instance as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>,
    notification.name as KeyValueMapKeys<TKVMap>,
    notification.value as KeyValueMapValues<TKVMap>,
    notification
  );
}

export function NotificationsObservableContextDispatch<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, K extends KeyValueMapKeys<TKVMap>>(
  instance: INotificationsObservableContext<TKVMap>,
  name: K,
  value: TKVMap[K]
): void {
  NotificationsObservableDispatch<TKVMap, K>(((instance as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, name, value);
}

export class NotificationsObservableContext<TKVMap extends KeyValueMapGenericConstraint<TKVMap>> extends ObservableContextBase<KeyValueMapToNotifications<TKVMap>> implements INotificationsObservableContext<TKVMap> {
  protected constructor(observable: INotificationsObservable<TKVMap>) {
    super(observable);
  }

  get observable(): INotificationsObservable<TKVMap> {
    // @ts-ignore
    return super.observable as INotificationsObservable<TKVMap>;
    // return ((this as unknown) as IObservableContextBaseInternal<KeyValueMapToNotifications<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    NotificationsObservableContextEmit<TKVMap>(this, value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    NotificationsObservableContextDispatch<TKVMap, K>(this, name, value);
    // this.emit(new Notification<TKVMap>(name, value));
  }

}

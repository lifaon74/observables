import {
  INotificationsObservable, INotificationsObservableConstructor, INotificationsObservableTypedConstructor,
} from './interfaces';
import { IObservable, IObservableTypedConstructor } from '../../../core/observable/interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { NotificationsObserver } from '../notifications-observer/implementation';
import { ObserverUnobserveOne } from '../../../core/observer/implementation';
import { KeyValueMapGeneric, KeyValueMapGenericConstraint, KeyValueMapKeys } from '../interfaces';
import { GetSetSuperArgsFunction, IsFactoryClass, MakeFactory } from '../../../classes/class-helpers/factory';
import { IObserver } from '../../../core/observer/interfaces';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { IS_OBSERVABLE_LIKE_CONSTRUCTOR, IsObservableLikeConstructor } from '../../../core/observable/constructor';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import {
  INotificationsObservableInternal, INotificationsObservablePrivate, NOTIFICATIONS_OBSERVABLE_PRIVATE
} from './privates';
import { ConstructNotificationsObservable, IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR } from './constructor';
import { INotificationsObservableContext } from './context/interfaces';
import {
  INotificationsObservableMatchOptions, KeyValueMapToNotifications, KeyValueMapToNotificationsObservers,
  TNotificationsObservableConstructorArgs, TNotificationsObservableHook
} from './types';
import { INotificationsObservableMatchOptionStrict, NormalizeNotificationsObservableMatchOptions } from './functions';


/** CONSTRUCTOR FUNCTIONS **/

/**
 * Called when an Observer observes a NotificationsObservable.
 * Registers the observer into 'observersMap' or 'othersObservers'
 */
export function NotificationsObservableOnObserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  observer: IObserver<KeyValueMapToNotifications<TKVMap>>
): void {
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
 */
export function NotificationsObservableOnUnobserved<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  observer: IObserver<KeyValueMapToNotifications<TKVMap>>
): void {
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


/** METHODS **/

/**
 *  Creates a NotificationsObserver with 'name' and 'callback' which observes this Observable
 */
export function NotificationsObservableAddListener<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, TKey extends KeyValueMapKeys<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: TKey,
  callback: (value: TKVMap[TKey]) => void
): INotificationsObserver<TKey, TKVMap[TKey]> {
  return new NotificationsObserver<TKey, TKVMap[TKey]>(name, callback).observe(instance);
}

/**
 * Removes the NotificationsObservers matching 'name' and 'callback' observing 'instance'
 */
export function NotificationsObservableRemoveListener<TKVMap extends KeyValueMapGenericConstraint<TKVMap>, TKey extends KeyValueMapKeys<TKVMap>>(instance: INotificationsObservable<TKVMap>, name: TKey, callback?: (value: TKVMap[TKey]) => void): void {
  const observers: IObserver<KeyValueMapToNotifications<TKVMap>>[] = Array.from(NotificationsObservableMatches<TKVMap>(instance, name, callback)); // clone the list before removing
  for (let i = 0, l = observers.length; i < l; i++) {
    ObserverUnobserveOne<KeyValueMapToNotifications<TKVMap>>((observers[i] as unknown) as any, instance);
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
 */
export function * NotificationsObservableMatches<TKVMap extends KeyValueMapGenericConstraint<TKVMap>>(
  instance: INotificationsObservable<TKVMap>,
  name: string,
  callback?: (value: any) => void,
  options?: INotificationsObservableMatchOptions,
): Generator<IObserver<KeyValueMapToNotifications<TKVMap>>, void, undefined> {
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


/** CLASS AND FACTORY **/

function PureNotificationsObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  // type TKVMap = never; // dirty hack
  // type TKVMap = { [key: string]: any };
  type TKVMap = KeyValueMapGeneric;

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

    addListener<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback: (value: TKVMap[TKey]) => void): INotificationsObserver<TKey, TKVMap[TKey]> {
      return NotificationsObservableAddListener<TKVMap, TKey>(this, name, callback);
    }

    removeListener<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback?: (value: TKVMap[TKey]) => void): void {
      NotificationsObservableRemoveListener<TKVMap, TKey>(this, name, callback);
    }

    on<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback: (value: TKVMap[TKey]) => void): this {
      this.addListener(name, callback).activate();
      return this;
    }

    off<TKey extends KeyValueMapKeys<TKVMap>>(name: TKey, callback?: (value: TKVMap[TKey]) => void): this {
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
    ): Generator<IObserver<KeyValueMapToNotifications<TKVMap>>, void, undefined> {
      return NotificationsObservableMatches<TKVMap>(this, name, callback, options);
    }
  };
}


export let NotificationsObservable: INotificationsObservableConstructor;

export function NotificationsObservableFactory<TBase extends Constructor<IObservable<KeyValueMapToNotifications<TKVMap>>>, TKVMap extends KeyValueMapGenericConstraint<TKVMap> = KeyValueMapGeneric>(superClass: TBase) {
  return MakeFactory<INotificationsObservableTypedConstructor<TKVMap>, [], TBase>(PureNotificationsObservableFactory, [], superClass, {
    name: 'NotificationsObservable',
    instanceOf: NotificationsObservable,
    waterMarks: [IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function NotificationsObservableBaseFactory<TBase extends Constructor, TKVMap extends KeyValueMapGenericConstraint<TKVMap> = KeyValueMapGeneric>(superClass: TBase) {
  return MakeFactory<INotificationsObservableTypedConstructor<TKVMap>, [IObservableTypedConstructor<KeyValueMapToNotifications<TKVMap>>], TBase>(PureNotificationsObservableFactory, [ObservableFactory], superClass, {
    name: 'NotificationsObservable',
    instanceOf: NotificationsObservable,
    waterMarks: [IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

NotificationsObservable = class NotificationsObservable extends NotificationsObservableBaseFactory<IBaseClassConstructor, KeyValueMapGeneric>(BaseClass) {
  constructor(create?: (context: INotificationsObservableContext<KeyValueMapGeneric>) => (TNotificationsObservableHook<KeyValueMapGeneric> | void)) {
    super([create], []);
  }
} as INotificationsObservableConstructor;




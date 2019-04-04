import { Notification } from '../notification/implementation';
import { INotificationsObservable, INotificationsObservableConstructor, INotificationsObservableContext, INotificationsObservableContextConstructor, TNotificationsObservableConstructorArgs } from './interfaces';
import { AllowObservableContextBaseConstruct, IObservableContextBaseInternal, IObservableInternal, IsObservableConstructor, Observable, OBSERVABLE_CONTEXT_BASE_PRIVATE, ObservableContextBase, ObservableFactory } from '../../../core/observable/implementation';
import { IObservable, IObservableContext, IObservableHook } from '../../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IObserver } from '../../../core/observer/interfaces';
import { INotificationsObserver } from '../notifications-observer/interfaces';
import { INotificationsObserverInternal, NOTIFICATIONS_OBSERVER_PRIVATE, NotificationsObserver } from '../notifications-observer/implementation';
import { OBSERVER_PRIVATE, ObserverUnobserveOne } from '../../../core/observer/implementation';
import { INotification } from '../notification/interfaces';
import { KeyValueMapGeneric, KeyValueMapKeys } from '../interfaces';
import { InitObservableHook, IObservableHookPrivate } from '../../../core/observable/hook';
import { Constructor, FactoryClass, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, SetSuperArgsForFactoryClass, SetSuperArgsForStandardClass } from '../../../classes/factory';


export const NOTIFICATIONS_OBSERVABLE_PRIVATE = Symbol('notifications-observable-private');

export interface INotificationsObservablePrivate<TKVMap extends KeyValueMapGeneric> extends IObservableHookPrivate<INotification<TKVMap>> {
  context: IObservableContext<INotification<TKVMap>>;
  observersMap: Map<KeyValueMapKeys<TKVMap>, INotificationsObserver<TKVMap>[]>; // map from a name to a list of observers
  othersObservers: IObserver<INotification<TKVMap>>[]; // observers which are not of type NotificationsObserver
}

export interface INotificationsObservableInternal<TKVMap extends KeyValueMapGeneric> extends INotificationsObservable<TKVMap>, IObservableInternal<INotification<TKVMap>> {
  [NOTIFICATIONS_OBSERVABLE_PRIVATE]: INotificationsObservablePrivate<TKVMap>;
}


/**
 * Constructs a NotificationsObservable
 * @param observable
 * @param context
 * @param create
 */
export function ConstructNotificationsObservable<TKVMap extends KeyValueMapGeneric>(
  observable: INotificationsObservable<TKVMap>,
  context: IObservableContext<INotification<TKVMap>>,
  create?: (context: INotificationsObservableContext<TKVMap>) => IObservableHook<INotification<TKVMap>> | void
): void {
  ConstructClassWithPrivateMembers(observable, NOTIFICATIONS_OBSERVABLE_PRIVATE);
  InitObservableHook(
    observable,
    (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE],
    create,
    NewNotificationsObservableContext
  );
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].context = context;
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap = new Map<KeyValueMapKeys<TKVMap>, INotificationsObserver<TKVMap>[]>();
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers = [];
}

export function IsNotificationsObservable(value: any): boolean {
  return (typeof value === 'object') && (value !== null ) && value.hasOwnProperty(NOTIFICATIONS_OBSERVABLE_PRIVATE);
}

const IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR = Symbol('is-notifications-observable-constructor');
export function IsNotificationsObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && HasFactoryWaterMark(value, IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR);
}


/**
 * Called when an Observer observes a NotificationsObservable.
 * Registers the observer into 'observersMap' or 'othersObservers'
 * @param observable
 * @param observer
 */
export function NotificationsObservableOnObserved<TKVMap extends KeyValueMapGeneric>(observable: INotificationsObservable<TKVMap>, observer: IObserver<INotification<TKVMap>>): void {
  if (observer instanceof NotificationsObserver) {
    if (!(observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.has((observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name)) {
      (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.set((observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name, []);
    }
    (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.get((observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name).push(observer as INotificationsObserver<TKVMap>);
  } else {
    (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers.push(observer);
  }
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

/**
 * Called when an Observer stops observing a NotificationsObservable.
 * Unregisters the observer into 'observersMap' or 'othersObservers'
 * @param observable
 * @param observer
 */
export function NotificationsObservableOnUnobserved<TKVMap extends KeyValueMapGeneric>(observable: INotificationsObservable<TKVMap>, observer: IObserver<INotification<TKVMap>>): void {
  if (observer instanceof NotificationsObserver) {
    const observers: INotificationsObserver<TKVMap>[] = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.get((observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name);
    observers.splice(observers.indexOf(observer as INotificationsObserver<TKVMap>), 1);
    if (observers.length === 0) {
      (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.delete((observer as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].name);
    }
  } else {
    (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers.splice(
      (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers.indexOf(observer),
      1
    );
  }
  (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}



/**
 * Removes the NotificationsObservers matching 'name' and 'callback' observing 'observable'
 * @param observable
 * @param name
 * @param callback
 */
export function NotificationsObservableRemoveListener<TKVMap extends KeyValueMapGeneric, K extends keyof TKVMap>(observable: INotificationsObservable<TKVMap>, name: K, callback?: (value: TKVMap[K]) => void): void {
  const observers: INotificationsObserver<TKVMap>[] = Array.from(NotificationsObservableMatches<TKVMap>(observable, name as string, callback)); // clone the list before removing
  for (let i = 0, l = observers.length; i < l; i++) {
    ObserverUnobserveOne<INotification<TKVMap>>(observers[i], observable);
  }
}

/**
 * Returns an Iterator over the list of NotificationsObservers matching 'name' and 'callback'
 * @param observable
 * @param name
 * @param callback
 */
export function * NotificationsObservableMatches<TKVMap extends KeyValueMapGeneric>(observable: INotificationsObservable<TKVMap>, name: string, callback?: (value: any) => void): IterableIterator<INotificationsObserver<TKVMap>> {
  if ((observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.has(name as any)) {
    const observers: INotificationsObserver<TKVMap>[] = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.get(name as any);
    if (callback === void 0) {
      for (let i = 0, l = observers.length; i < l; i++) {
        yield observers[i];
      }
    } else {
      for (let i = 0, l = observers.length; i < l; i++) {
        if ((observers[i] as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback === callback) {
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
export function NotificationsObservableDispatch<TKVMap extends KeyValueMapGeneric, K extends keyof TKVMap>(observable: INotificationsObservable<TKVMap>, name: K, value: TKVMap[K] = void 0, notification?: INotification<TKVMap>): void {
  if ((observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.has(name as Extract<K, string>)) {
    const observers: INotificationsObserver<TKVMap>[] = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].observersMap.get(name as Extract<K, string>).slice(0);
    for (let i = 0, l = observers.length; i < l; i++) {
      (observers[i] as INotificationsObserverInternal<TKVMap>)[NOTIFICATIONS_OBSERVER_PRIVATE].callback(value);
    }
  }

  const length: number = (observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers.length;
  if (length > 0) {
    if (notification === void 0) {
      notification = new Notification<TKVMap>(name as Extract<K, string>, value);
    }
    for (let i = 0; i < length; i++) {
      ((observable as INotificationsObservableInternal<TKVMap>)[NOTIFICATIONS_OBSERVABLE_PRIVATE].othersObservers[i] as any)[OBSERVER_PRIVATE].onEmit(notification, observable);
    }
  }
}


export function NotificationsObservableFactory<TBase extends Constructor<IObservable<any>>>(superClass: TBase) {
  type TKVMap = never; // dirty hack
  // type TKVMap = { [key: string]: any };
  if (!IsObservableConstructor(superClass)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return FactoryClass(class NotificationsObservable extends superClass implements INotificationsObservable<TKVMap> {
    constructor(...args: any[]) {
      const [create]: TNotificationsObservableConstructorArgs<TKVMap> = args[0];

      let context: IObservableContext<INotification<TKVMap>> = void 0;
      super(...setSuperArgs(args.slice(1), [
        (_context: IObservableContext<INotification<TKVMap>>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<INotification<TKVMap>>): void => {
              NotificationsObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<INotification<TKVMap>>): void => {
              NotificationsObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      ConstructNotificationsObservable<TKVMap>(this, context, create);
    }

    addListener<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<Pick<TKVMap, K>> {
      return new NotificationsObserver<Pick<TKVMap, K>>(name, callback).observe(this);
    }

    removeListener<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): void {
      NotificationsObservableRemoveListener<TKVMap, K>(this, name, callback);
    }

    on<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): this {
      this.addListener(name, callback).activate();
      return this;
    }

    off<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): this {
      this.removeListener(name, callback);
      return this;
    }

    matches(name: string, callback?: (value: any) => void): IterableIterator<INotificationsObserver<TKVMap>> {
      return NotificationsObservableMatches<TKVMap>(this, name, callback);
    }

  })<TNotificationsObservableConstructorArgs<TKVMap>>('NotificationsObservable', IS_NOTIFICATIONS_OBSERVABLE_CONSTRUCTOR);
}

export const NotificationsObservable: INotificationsObservableConstructor = class NotificationsObservable extends NotificationsObservableFactory(ObservableFactory<ObjectConstructor>(Object)) {
  constructor(create?: (context: INotificationsObservableContext<any>) => (IObservableHook<any> | void)) {
  // constructor(create?: any) {
    super([create], []);
  }
};


/* ------------------------------------------- */


export function NewNotificationsObservableContext<TKVMap extends KeyValueMapGeneric>(observable: IObservable<INotification<TKVMap>>): INotificationsObservableContext<TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: INotificationsObservableContext<TKVMap> = new((NotificationsObservableContext as any) as INotificationsObservableContextConstructor)<TKVMap>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function NotificationsObservableContextEmit<TKVMap extends KeyValueMapGeneric>(context: INotificationsObservableContext<TKVMap>, notification: INotification<TKVMap>): void {
  NotificationsObservableDispatch<TKVMap, INotification<TKVMap>['name']>(((context as unknown) as IObservableContextBaseInternal<INotification<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, notification.name, notification.value, notification);
}

export function NotificationsObservableContextDispatch<TKVMap extends KeyValueMapGeneric, K extends keyof TKVMap>(context: INotificationsObservableContext<TKVMap>, name: K, value: TKVMap[K] = void 0): void {
  NotificationsObservableDispatch<TKVMap, K>(((context as unknown) as IObservableContextBaseInternal<INotification<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>, name, value);
}

export class NotificationsObservableContext<TKVMap extends KeyValueMapGeneric> extends ObservableContextBase<INotification<TKVMap>> implements INotificationsObservableContext<TKVMap> {
  protected constructor(observable: INotificationsObservable<TKVMap>) {
    super(observable);
  }

  get observable(): INotificationsObservable<TKVMap> {
    return ((this as unknown) as IObservableContextBaseInternal<INotification<TKVMap>>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as INotificationsObservable<TKVMap>;
  }

  emit(value: INotification<TKVMap>): void {
    NotificationsObservableContextEmit<TKVMap>(this, value);
  }

  dispatch<K extends keyof TKVMap>(name: K, value?: TKVMap[K]): void {
    NotificationsObservableContextDispatch<TKVMap, K>(this, name, value);
    // this.emit(new Notification<TKVMap>(name, value));
  }

}

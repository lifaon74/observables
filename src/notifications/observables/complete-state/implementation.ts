import { InitObservableHook, IObservableHookPrivate } from '../../../core/observable/hook';
import {
  IObservable, IObservableConstructor, IObservableContextBase, IObservableHook
} from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableContext, INotificationsObservableTypedConstructor,
  KeyValueMapToNotifications, KeyValueMapToNotificationsGeneric
} from '../../core/notifications-observable/interfaces';
import {
  CompleteStateKeyValueMapConstraint, CompleteStateObservableKeyValueMapGeneric, ICompleteStateObservable,
  ICompleteStateObservableConstructor, ICompleteStateObservableContext, ICompleteStateObservableContextConstructor,
  ICompleteStateObservableOptions, TCompleteStateObservableConstructorArgs, TCompleteStateObservableMode,
  TCompleteStateObservableState
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { AllowObservableContextBaseConstruct, ObservableFactory } from '../../../core/observable/implementation';
import {
  IsNotificationsObservableConstructor, NotificationsObservableContext, NotificationsObservableFactory
} from '../../core/notifications-observable/implementation';
import { Notification } from '../../core/notification/implementation';
import { KeyValueMapKeys, KeyValueMapValues } from '../../core/interfaces';
import { IsObject } from '../../../helpers';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/factory';
import { IObserver } from '../../../core/observer/interfaces';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/implementation';
import { INotificationsObserverLike } from '../../core/notifications-observer/interfaces';


export const COMPLETE_STATE_OBSERVABLE_PRIVATE = Symbol('complete-state-observable-private');


export interface ICompleteStateObservablePrivate<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> extends IObservableHookPrivate<KeyValueMapToNotifications<TKVMap>> {
  context: INotificationsObservableContext<TKVMap>;
  values: KeyValueMapToNotifications<TKVMap>[];

  mode: TCompleteStateObservableMode;

  state: TCompleteStateObservableState;
}

export interface ICompleteStateObservableInternal<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>> extends ICompleteStateObservable<T, TKVMap> {
  [COMPLETE_STATE_OBSERVABLE_PRIVATE]: ICompleteStateObservablePrivate<T, TKVMap>;
}


export function ConstructCompleteStateObservable<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(
  instance: ICompleteStateObservable<T, TKVMap>,
  context: INotificationsObservableContext<TKVMap>,
  create?: (context: ICompleteStateObservableContext<T, TKVMap>) => (IObservableHook<T> | void),
  options: ICompleteStateObservableOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, COMPLETE_STATE_OBSERVABLE_PRIVATE);
  const privates: ICompleteStateObservablePrivate<T, TKVMap> = (instance as ICompleteStateObservableInternal<T, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];

  privates.context = context;
  privates.values = [];

  if (IsObject(options)) {
    privates.mode = NormalizeCompleteStateObserversMode(options.mode);
  } else {
    throw new TypeError(`Expected object or void as onCompleteOptions`);
  }

  privates.state = 'emitting';

  type TObservable = KeyValueMapToNotifications<TKVMap>;

  InitObservableHook<TObservable>(
    instance,
    privates,
    NewCompleteStateObservableContext as unknown as (observable: IObservable<TObservable>) => IObservableContextBase<TObservable>,
    create as unknown as (context: IObservableContextBase<TObservable>) => (IObservableHook<TObservable> | void),
  );
}


export function IsCompleteStateObservable(value: any): value is ICompleteStateObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(COMPLETE_STATE_OBSERVABLE_PRIVATE as symbol);
}

const IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-observable-constructor');

export function IsCompleteStateObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === CompleteStateObservable) || HasFactoryWaterMark(value, IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR));
}


function NormalizeCompleteStateObserversMode(action?: TCompleteStateObservableMode): TCompleteStateObservableMode {
  switch (action) {
    case void 0:
      return 'once';
    case 'once':
    case 'cache':
    case 'cache-final-state':
    case 'cache-all':
    case 'throw-after-complete-observers':
      return action;
    default:
      throw new TypeError(`Expected 'once', 'cache', 'cache-final-state', 'cache-all' or 'throw-after-complete-observers' as mode`);
  }
}

// function IsCompleteStateObservableFinalNotificationName(name: string): boolean {
//   return (
//     (name === 'complete')
//     || (name === 'error')
//   );
// }
//
// function IsCompleteStateObservableNotificationName(name: string): boolean {
//   return (name === 'next')
//     || IsCompleteStateObservableFinalNotificationName(name);
// }


export function CompleteStateObservableOnEmit<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(instance: ICompleteStateObservable<T, TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  const privates: ICompleteStateObservablePrivate<T, TKVMap> = (instance as ICompleteStateObservableInternal<T, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  const isFinalState: boolean = (
    (notification.name === 'complete')
    || (notification.name === 'error')
  );

  const isNextState: boolean = (notification.name === 'next');

  if (isFinalState || isNextState) {
    if (privates.state === 'emitting') {
      if (
        (privates.mode === 'cache')
        || (privates.mode === 'cache-all')
        || (
          (privates.mode === 'cache-final-state')
          && isFinalState
        )
      ) {
        privates.values.push(notification);
      }

      if (isFinalState) {
        privates.state = notification.name as ('complete' | 'error');
      }
    } else {
      throw new TypeError(`Cannot emit a notification with the name '${ notification.name }' when the observable is in '${ privates.state }' state`);
    }
  } else {
    if (privates.mode === 'cache-all') {
      privates.values.push(notification);
    }
  }
}

export function CompleteStateObservableOnObserved<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(instance: ICompleteStateObservable<T, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: ICompleteStateObservablePrivate<T, TKVMap> = (instance as ICompleteStateObservableInternal<T, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  if (
    (privates.mode === 'throw-after-complete-observers')
    && (privates.state !== 'emitting')
  ) {
    const result: INotificationsObserverLike<string, any> | null = ExtractObserverNameAndCallback<string, any>(observer);
    if (
      (result !== null)
      && (
        (result.name === 'next')
        || (result.name === 'complete')
        || (result.name === 'error')
      )
    ) {
      throw new Error(`Cannot observe this Observable because it is the state '${ privates.state  }'.`);
    }
  }

  // INFO privates.values is empty if not cached
  for (let i = 0, l = privates.values.length; i < l; i++) {
    observer.emit(privates.values[i]);
  }

  privates.onObserveHook(observer);
}

export function CompleteStateObservableOnUnobserved<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(instance: ICompleteStateObservable<T, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  (instance as ICompleteStateObservableInternal<T, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

export function CompleteStateObservableGetState<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(instance: ICompleteStateObservable<T, TKVMap>): TCompleteStateObservableState {
  const privates: ICompleteStateObservablePrivate<T, TKVMap> = (instance as ICompleteStateObservableInternal<T, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  return (
    (privates.mode === 'cache')
    || (privates.mode === 'cache-all')
    || (privates.mode === 'cache-final-state')
  )
    ? 'cached'
    : privates.state;
}



function PureCompleteStateObservableFactory<TBase extends Constructor<INotificationsObservable<CompleteStateObservableKeyValueMapGeneric<any>>>>(superClass: TBase) {
  type T = any;
  type TKVMap = CompleteStateObservableKeyValueMapGeneric<T>;

  if (!IsNotificationsObservableConstructor(superClass)) {
    throw new TypeError(`Expected NotificationsObservable constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class CompleteStateObservable extends superClass implements ICompleteStateObservable<T, TKVMap> {
    constructor(...args: any[]) {
      const [create, options]: TCompleteStateObservableConstructorArgs<T, TKVMap> = args[0];
      let context: INotificationsObservableContext<TKVMap>;
      super(...setSuperArgs(args.slice(1), [
        (_context: INotificationsObservableContext<TKVMap>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              CompleteStateObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              CompleteStateObservableOnUnobserved(this, observer);
            },
          };
        }
      ]));
      // @ts-ignore
      ConstructCompleteStateObservable<T, TKVMap>(this, context, create, options);
    }

    get state(): TCompleteStateObservableState {
      return CompleteStateObservableGetState<T, TKVMap>(this);
    }
  };
}

export let CompleteStateObservable: ICompleteStateObservableConstructor;

export function CompleteStateObservableFactory<TBase extends Constructor<INotificationsObservable<CompleteStateObservableKeyValueMapGeneric<any>>>>(superClass: TBase) {
  return MakeFactory<ICompleteStateObservableConstructor, [], TBase>(PureCompleteStateObservableFactory, [], superClass, {
    name: 'CompleteStateObservable',
    instanceOf: CompleteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function CompleteStateObservableBaseFactory<TBase extends Constructor>(superClass: TBase) { // INotificationsObservableTypedConstructor<CompleteStateObservableKeyValueMapGeneric<any>>
  return MakeFactory<ICompleteStateObservableConstructor, [INotificationsObservableTypedConstructor<CompleteStateObservableKeyValueMapGeneric<any>>, IObservableConstructor], TBase>(PureCompleteStateObservableFactory, [NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'CompleteStateObservable',
    instanceOf: CompleteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}

CompleteStateObservable = class CompleteStateObservable1 extends CompleteStateObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(create?: (context: ICompleteStateObservableContext<any, CompleteStateObservableKeyValueMapGeneric<any>>) => (IObservableHook<any> | void), options?: ICompleteStateObservableOptions) {
    super([create as any, options], [], []);
  }
} as ICompleteStateObservableConstructor;


/*--------------------------*/


export function NewCompleteStateObservableContext<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap>>(observable: ICompleteStateObservable<T, TKVMap>): ICompleteStateObservableContext<T, TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: ICompleteStateObservableContext<T, TKVMap> = new ((CompleteStateObservableContext as any) as ICompleteStateObservableContextConstructor)<T, TKVMap>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}


export class CompleteStateObservableContext<T, TKVMap extends CompleteStateKeyValueMapConstraint<T, TKVMap> = CompleteStateObservableKeyValueMapGeneric<T>> extends NotificationsObservableContext<TKVMap> implements ICompleteStateObservableContext<T, TKVMap> {
  protected constructor(observable: ICompleteStateObservable<T, TKVMap>) {
    super(observable);
  }

  get observable(): ICompleteStateObservable<T, TKVMap> {
    return super.observable as ICompleteStateObservable<T, TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    CompleteStateObservableOnEmit<T, TKVMap>(this.observable, value);
    super.emit(value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    this.emit(new Notification<K, TKVMap[K]>(name, value) as KeyValueMapToNotificationsGeneric<TKVMap> as KeyValueMapToNotifications<TKVMap>);
  }

  next(value: T): void {
    this.dispatch('next' as KeyValueMapKeys<TKVMap>, value as KeyValueMapValues<TKVMap>);
  }

  complete(): void {
    this.dispatch('complete' as KeyValueMapKeys<TKVMap>, void 0 as KeyValueMapValues<TKVMap>);
  }

  error(error?: any): void {
    this.dispatch('error' as KeyValueMapKeys<TKVMap>, error as KeyValueMapValues<TKVMap>);
  }
}

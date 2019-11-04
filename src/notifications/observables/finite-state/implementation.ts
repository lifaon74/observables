import {
  IObservableConstructor
} from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableTypedConstructor
} from '../../core/notifications-observable/interfaces';
import {
  FinalStateConstraint, FiniteStateKeyValueMapConstraint, FiniteStateObservableModeConstraint, IFiniteStateObservable,
  IFiniteStateObservableConstructor, IFiniteStateObservableContext, IFiniteStateObservableContextConstructor,
  IFiniteStateObservableKeyValueMapGeneric, IFiniteStateObservableOptions, IFiniteStateObservableSoftConstructor,
  TFiniteStateObservableConstructorArgs, TFiniteStateObservableFinalState, TFiniteStateObservableGeneric,
  TFiniteStateObservableMode, TFiniteStateObservableState
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  NotificationsObservableFactory
} from '../../core/notifications-observable/implementation';
import { Notification } from '../../core/notification/implementation';
import { KeyValueMapKeys, KeyValueMapValues } from '../../core/interfaces';
import { EnumToString, IsObject } from '../../../helpers';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/class-helpers/factory';
import { IObserver } from '../../../core/observer/interfaces';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { IObservableContextBase } from '../../../core/observable/context/base/interfaces';
import { AllowObservableContextBaseConstruct } from '../../../core/observable/context/base/constructor';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { InitObservableHook } from '../../../core/observable/hook/init';
import { IsNotificationsObservableConstructor } from '../../core/notifications-observable/constructor';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import {
  KeyValueMapToNotifications, KeyValueMapToNotificationsGeneric
} from '../../core/notifications-observable/types';
import { NotificationsObservableContext } from '../../core/notifications-observable/context/implementation';
import { INotificationsObserverLike } from '../../core/notifications-observer/types';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/functions';


export const COMPLETE_STATE_OBSERVABLE_PRIVATE = Symbol('finite-state-observable-private');

export interface IFiniteStateObservablePrivate<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
> extends IObservableHookPrivate<KeyValueMapToNotifications<TKVMap>> {
  context: INotificationsObservableContext<TKVMap>;
  values: KeyValueMapToNotifications<TKVMap>[];

  finalStates: Set<TFinalState>;
  modes: Set<TMode>;
  mode: TMode;
  state: TFiniteStateObservableState<TFinalState>;
}

export interface IFiniteStateObservableInternal<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
> extends IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
  [COMPLETE_STATE_OBSERVABLE_PRIVATE]: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap>;
}


export function ConstructFiniteStateObservable<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(
  instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  context: INotificationsObservableContext<TKVMap>,
  create?: (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) => (IObservableHook<TValue> | void),
  options: IFiniteStateObservableOptions<TFinalState, TMode> = {}
): void {
  ConstructClassWithPrivateMembers(instance, COMPLETE_STATE_OBSERVABLE_PRIVATE);
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode,  TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];

  privates.context = context;
  privates.values = [];

  if (IsObject(options)) {
    privates.finalStates = NormalizeFiniteStateObservableFinalStates<TFinalState>(options.finalStates);
    privates.modes = NormalizeFiniteStateObservableModes<TMode>(options.modes);
    privates.mode = NormalizeFiniteStateObservableMode<TMode>(privates.modes, options.mode);
  } else {
    throw new TypeError(`Expected object or void as options.mode`);
  }

  privates.state = 'next';

  type TObservable = KeyValueMapToNotifications<TKVMap>;

  InitObservableHook(
    instance,
    privates,
    NewFiniteStateObservableContext,
    create as unknown as (context: IObservableContextBase<TObservable>) => (IObservableHook<TObservable> | void),
  );
}


export function IsFiniteStateObservable(value: any): value is TFiniteStateObservableGeneric {
  return IsObject(value)
    && value.hasOwnProperty(COMPLETE_STATE_OBSERVABLE_PRIVATE as symbol);
}

const IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-observable-constructor');

export function IsFiniteStateObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === FiniteStateObservable) || HasFactoryWaterMark(value, IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR));
}


export function GetFiniteStateObservableDefaultFinalStates(): Set<TFiniteStateObservableFinalState> {
  return new Set<TFiniteStateObservableFinalState>(['complete', 'error'] as TFiniteStateObservableFinalState[]);
}

export function NormalizeFiniteStateObservableFinalStates<TFinalState extends FinalStateConstraint<TFinalState>>(finalStates?: Iterable<TFinalState>): Set<TFinalState> {
  const defaultSet: Set<TFiniteStateObservableFinalState> = GetFiniteStateObservableDefaultFinalStates();

  if (finalStates === void 0) {
    return defaultSet as Set<TFinalState>;
  } else if (Symbol.iterator in finalStates) {
    const _finalStates: Set<TFinalState> = new Set<TFinalState>(finalStates);

    if (_finalStates.has('next' as TFinalState)) {
      throw new TypeError(`finalStates must not contain 'next'`);
    }

    {
      const iterator: Iterator<TFiniteStateObservableFinalState> = defaultSet.values();
      let result: IteratorResult<TFiniteStateObservableFinalState>;
      while (!(result = iterator.next()).done) {
        if (!_finalStates.has(result.value as TFinalState)) {
          throw new TypeError(`finalStates must contain '${ result.value }'`);
        }
      }
    }

    {
      const iterator: Iterator<TFinalState> = _finalStates.values();
      let i: number = 0;
      let result: IteratorResult<TFinalState>;
      while (!(result = iterator.next()).done) {
        if (typeof result.value !== 'string') {
          throw new TypeError(`Expected Iterable of string as finalStates, found '${ result.value }' at index ${ i }`);
        }
        i++;
      }

    }

    return _finalStates;
  } else {
    throw new TypeError(`Expected Iterable<TFinalState> or void as finalStates`);
  }


}

export function GetFiniteStateObservableDefaultModes(): Set<TFiniteStateObservableMode> {
  return new Set<TFiniteStateObservableMode>(['once', 'uniq', 'cache', 'cache-final-state', 'cache-all'] as TFiniteStateObservableMode[]);
}

export function NormalizeFiniteStateObservableModes<TMode extends FiniteStateObservableModeConstraint<TMode>>(modes?: Iterable<TMode>): Set<TMode> {
  const defaultSet: Set<TFiniteStateObservableMode> = GetFiniteStateObservableDefaultModes();

  if (modes === void 0) {
    return defaultSet as Set<TMode>;
  } else if (Symbol.iterator in modes) {
    const _modes: Set<TMode> = new Set<TMode>(modes);

    {
      const iterator: Iterator<TFiniteStateObservableMode> = defaultSet.values();
      let result: IteratorResult<TFiniteStateObservableMode>;
      while (!(result = iterator.next()).done) {
        if (!_modes.has(result.value as TMode)) {
          throw new TypeError(`modes must contain '${ result.value }'`);
        }
      }
    }

    {
      const iterator: Iterator<TMode> = _modes.values();
      let i: number = 0;
      let result: IteratorResult<TMode>;
      while (!(result = iterator.next()).done) {
        if (typeof result.value !== 'string') {
          throw new TypeError(`Expected Iterable of string as modes, found '${ result.value }' at index ${ i }`);
        }
        i++;
      }
    }

    return _modes;
  } else {
    throw new TypeError(`Expected Iterable<TMode> or void as finalStates`);
  }
}

export function NormalizeFiniteStateObservableMode<TMode extends FiniteStateObservableModeConstraint<TMode>>(modes: Set<TMode>, mode?: TMode): TMode {
  if (mode === void 0) {
    return 'once'as TMode;
  } else if (modes.has(mode)) {
    return mode;
  } else {
    throw new TypeError(`Expected void or ${ EnumToString(Array.from(modes)) } as mode`);
  }
}


export function IsFiniteStateObservableFinalState<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, name: string): boolean {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].finalStates.has(name as TFinalState);
}

export function IsFiniteStateObservableNextState(name: string): boolean {
  return (name === 'next');
}

// export function IsFiniteStateObservableNotificationName(name: string): boolean {
//   return (name === 'next')
//     || IsFiniteStateObservableFinalNotificationName(name);
// }


export function IsFiniteStateObservableCachingValues<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): boolean {
  return IsFiniteStateObservableCachingValuesMode<TMode>((instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].mode);
}

export function IsFiniteStateObservableCachingValuesMode<TMode extends FiniteStateObservableModeConstraint<TMode>>(mode: TMode): boolean {
  return (
    (mode === 'cache')
    || (mode === 'cache-final-state')
    || (mode === 'cache-all')
  );
}


export function ThrowFiniteStateObservableCannotEmitAfterFiniteState(state: string, notificationName: string): never {
  throw new TypeError(`Cannot emit a notification with the name '${ notificationName }' when the observable is in a final state '${ state }'`);
}

/**
 * Called when this Observable emits a data
 * @param instance
 * @param notification
 */
export function FiniteStateObservableOnEmit<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  const isFinalState: boolean = IsFiniteStateObservableFinalState<TValue, TFinalState, TMode, TKVMap>(instance, notification.name);

  if (isFinalState || IsFiniteStateObservableNextState(notification.name)) {
    if (privates.state === 'next') {
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
        privates.state = notification.name as TFinalState;
      }
    } else {
      ThrowFiniteStateObservableCannotEmitAfterFiniteState(privates.state, notification.name);
    }
  } else {
    if (privates.mode === 'cache-all') {
      privates.values.push(notification);
    }
  }
}

export function FiniteStateObservableClearCache<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  if (privates.state !== 'next') {
    throw new Error(`Clearing FiniteStateObservable's cache may only be performed when its state is 'next'`);
  } else if (instance.observed)  {
    throw new Error(`Clearing FiniteStateObservable's cache may only be performed when it is not observed`);
  } else {
    privates.values = [];
  }
}


export function FiniteStateObservableOnObserved<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE];
  if (
    (privates.mode === 'uniq')
    && (privates.state !== 'next')
  ) {
    const result: INotificationsObserverLike<string, any> | null = ExtractObserverNameAndCallback<string, any>(observer);
    if (
      (result !== null)
      && (
        IsFiniteStateObservableNextState(result.name)
        || IsFiniteStateObservableFinalState<TValue, TFinalState, TMode, TKVMap>(instance, result.name)
      )
    ) {
      throw new Error(`Cannot observe this Observable because it is the state '${ privates.state }'.`);
    }
  }

  // INFO privates.values is empty if not cached
  for (let i = 0, l = privates.values.length; i < l; i++) {
    observer.emit(privates.values[i]);
  }

  privates.onObserveHook(observer);
}

export function FiniteStateObservableOnUnobserved<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

export function FiniteStateObservableGetState<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): TFiniteStateObservableState<TFinalState> {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].state;
}

export function FiniteStateObservableGetMode<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): TMode {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[COMPLETE_STATE_OBSERVABLE_PRIVATE].mode;
}


function PureFiniteStateObservableFactory<TBase extends Constructor<INotificationsObservable<IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>>>(superClass: TBase) {
  type TValue = any;
  type TFinalState = TFiniteStateObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;

  if (!IsNotificationsObservableConstructor(superClass)) {
    throw new TypeError(`Expected NotificationsObservable constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FiniteStateObservable extends superClass implements IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
    constructor(...args: any[]) {
      const [create, options]: TFiniteStateObservableConstructorArgs<TValue, TFinalState, TMode, TKVMap> = args[0];
      let context: INotificationsObservableContext<TKVMap>;
      super(...setSuperArgs(args.slice(1), [
        (_context: INotificationsObservableContext<TKVMap>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              FiniteStateObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void => {
              FiniteStateObservableOnUnobserved(this, observer);
            },
          };
        }
      ]));
      // @ts-ignore
      ConstructFiniteStateObservable<TValue, TFinalState, TKVMap>(this, context, create, options);
    }

    get state(): TFiniteStateObservableState<TFinalState> {
      return FiniteStateObservableGetState<TValue, TFinalState, TMode, TKVMap>(this);
    }

    get mode(): TMode {
      return FiniteStateObservableGetMode<TValue, TFinalState, TMode, TKVMap>(this);
    }
  };
}

export let FiniteStateObservable: IFiniteStateObservableConstructor;

export function FiniteStateObservableFactory<TBase extends Constructor<INotificationsObservable<IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>>>(superClass: TBase) {
  return MakeFactory<IFiniteStateObservableConstructor, [], TBase>(PureFiniteStateObservableFactory, [], superClass, {
    name: 'FiniteStateObservable',
    instanceOf: FiniteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FiniteStateObservableSoftFactory<TBase extends Constructor<INotificationsObservable<IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>>>(superClass: TBase) {
  return MakeFactory<IFiniteStateObservableSoftConstructor, [], TBase>(PureFiniteStateObservableFactory, [], superClass, {
    name: 'FiniteStateObservable',
    instanceOf: FiniteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FiniteStateObservableBaseFactory<TBase extends Constructor>(superClass: TBase) { // INotificationsObservableTypedConstructor<FiniteStateObservableKeyValueMapGeneric<any>>
  return MakeFactory<IFiniteStateObservableSoftConstructor, [
    INotificationsObservableTypedConstructor<IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>,
    IObservableConstructor
    ], TBase>(PureFiniteStateObservableFactory, [NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FiniteStateObservable',
    instanceOf: FiniteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}


FiniteStateObservable = class FiniteStateObservable extends FiniteStateObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(
    create?: (context: IFiniteStateObservableContext<any, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>) => (IObservableHook<any> | void),
    options?: IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TFiniteStateObservableMode>
  ) {
    super([create as any, options], [], []);
  }
} as IFiniteStateObservableConstructor;


/*--------------------------*/


export function NewFiniteStateObservableContext<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
>(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> = new ((FiniteStateObservableContext as any) as IFiniteStateObservableContextConstructor)<TValue, TFinalState, TMode, TKVMap>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}


export class FiniteStateObservableContext<
  TValue,
  TFinalState extends FinalStateConstraint<TFinalState>,
  TMode extends FiniteStateObservableModeConstraint<TMode>,
  TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>
> extends NotificationsObservableContext<TKVMap> implements IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> {
  protected constructor(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>) {
    super(observable);
  }

  get observable(): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
    // @ts-ignore
    return super.observable as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    FiniteStateObservableOnEmit<TValue, TFinalState, TMode, TKVMap>(this.observable, value);
    super.emit(value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    this.emit(new Notification<K, TKVMap[K]>(name, value) as KeyValueMapToNotificationsGeneric<TKVMap> as KeyValueMapToNotifications<TKVMap>);
  }

  next(value: TValue): void {
    this.dispatch('next' as KeyValueMapKeys<TKVMap>, value as KeyValueMapValues<TKVMap>);
  }

  complete(): void {
    this.dispatch('complete' as KeyValueMapKeys<TKVMap>, void 0 as KeyValueMapValues<TKVMap>);
  }

  error(error?: any): void {
    this.dispatch('error' as KeyValueMapKeys<TKVMap>, error as KeyValueMapValues<TKVMap>);
  }

  clearCache(): void {
    FiniteStateObservableClearCache<TValue, TFinalState, TMode, TKVMap>(this.observable);
  }
}


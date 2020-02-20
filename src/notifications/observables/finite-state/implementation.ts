import { IObservableTypedConstructor } from '../../../core/observable/interfaces';
import {
  INotificationsObservable, INotificationsObservableTypedConstructor
} from '../../core/notifications-observable/interfaces';
import {
  IFiniteStateObservable, IFiniteStateObservableConstructor, IFiniteStateObservableTypedConstructor,
} from './interfaces';
import { NotificationsObservableFactory } from '../../core/notifications-observable/implementation';
import {
  GetSetSuperArgsFunction, IsFactoryClass, MakeFactory, TMakeFactoryCreateSuperClass
} from '../../../classes/class-helpers/factory';
import { IObserver } from '../../../core/observer/interfaces';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IsNotificationsObservableConstructor } from '../../core/notifications-observable/constructor';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import { KeyValueMapToNotifications } from '../../core/notifications-observable/types';
import { INotificationsObserverLike } from '../../core/notifications-observer/types';
import { ExtractObserverNameAndCallback } from '../../core/notifications-observer/functions';
import {
  FINITE_STATE_OBSERVABLE_PRIVATE, IFiniteStateObservableInternal, IFiniteStateObservablePrivate
} from './privates';
import {
  IFiniteStateObservableOptions, TFinalStateConstraint, TFiniteStateKeyValueMapConstraint,
  TFiniteStateObservableConstructorArgs, TFiniteStateObservableCreateCallback, TFiniteStateObservableFinalState,
  TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableMode, TFiniteStateObservableModeConstraint,
  TFiniteStateObservableState
} from './types';
import { ConstructFiniteStateObservable, IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR } from './constructor';
import {
  IsFiniteStateObservableCachingValuesPerObserverMode, IsFiniteStateObservableFinalState,
  IsFiniteStateObservableNextState
} from './functions';


/** CONSTRUCTOR FUNCTIONS **/

export function FiniteStateObservableOnObserved<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE];
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

  const startIndex: number = (
    IsFiniteStateObservableCachingValuesPerObserverMode(privates.mode)
    && privates.lastValueIndexPerObserver.has(observer)
  )
    ? privates.lastValueIndexPerObserver.get(observer) as number
    : 0;


  // INFO privates.values is empty if not cached
  for (let i = startIndex, l = privates.values.length; i < l; i++) {
    observer.emit(privates.values[i]);
  }

  privates.onObserveHook(observer);
}

export function FiniteStateObservableOnUnobserved<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, observer: IObserver<KeyValueMapToNotifications<TKVMap>>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE];
  if (IsFiniteStateObservableCachingValuesPerObserverMode(privates.mode)) {
    privates.lastValueIndexPerObserver.set(observer, privates.values.length);
  }
  privates.onUnobserveHook(observer);
}

/** METHODS **/

/* GETTERS/SETTERS */

export function FiniteStateObservableGetState<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): TFiniteStateObservableState<TFinalState> {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE].state;
}

export function FiniteStateObservableGetMode<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): TMode {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE].mode;
}

/** CLASS AND FACTORY **/

function PureFiniteStateObservableFactory<TBase extends Constructor<INotificationsObservable<TFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>>>(superClass: TBase) {
  type TValue = any;
  type TFinalState = TFiniteStateObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = TFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>;

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


export function FiniteStateObservableFactory<TBase extends Constructor<INotificationsObservable<TFiniteStateObservableKeyValueMapGeneric<TValue, TFiniteStateObservableFinalState>>>,
  TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(superClass: TBase) {
  return MakeFactory<IFiniteStateObservableTypedConstructor<TValue, TFinalState, TMode, TKVMap>, [], TBase>(PureFiniteStateObservableFactory, [], superClass, {
    name: 'FiniteStateObservable',
    instanceOf: FiniteStateObservable,
    waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FiniteStateObservableBaseFactory<TBase extends Constructor,
  TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(superClass: TBase) {
  type TSuperClasses = [
    INotificationsObservableTypedConstructor<TKVMap>,
    IObservableTypedConstructor<KeyValueMapToNotifications<TKVMap>>
  ];
  return MakeFactory<IFiniteStateObservableTypedConstructor<TValue, TFinalState, TMode, TKVMap>, TSuperClasses, TBase>(
    PureFiniteStateObservableFactory as (superClass: TMakeFactoryCreateSuperClass<TSuperClasses>) => TMakeFactoryCreateSuperClass<TSuperClasses>,
    [NotificationsObservableFactory, ObservableFactory],
    superClass,
    {
      name: 'FiniteStateObservable',
      instanceOf: FiniteStateObservable,
      waterMarks: [IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR],
    }
  );
}


FiniteStateObservable = class AFiniteStateObservable extends FiniteStateObservableBaseFactory<IBaseClassConstructor,
  unknown,
  TFiniteStateObservableFinalState,
  TFiniteStateObservableMode,
  TFiniteStateObservableKeyValueMapGeneric<unknown, TFiniteStateObservableFinalState>>(BaseClass) {
  constructor(
    create?: TFiniteStateObservableCreateCallback<unknown, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<unknown, TFiniteStateObservableFinalState>>,
    options?: IFiniteStateObservableOptions<TFiniteStateObservableFinalState, TFiniteStateObservableMode>
  ) {
    super([create, options], [], []);
  }
} as IFiniteStateObservableConstructor;



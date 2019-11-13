import {
  IFiniteStateObservableOptions, TFinalStateConstraint, TFiniteStateKeyValueMapConstraint,
  TFiniteStateObservableGeneric, TFiniteStateObservableModeConstraint
} from './types';
import { IsObject } from '../../../helpers';
import {
  FINITE_STATE_OBSERVABLE_PRIVATE, IFiniteStateObservableInternal, IFiniteStateObservablePrivate
} from './privates';
import { IFiniteStateObservable } from './interfaces';
import { INotificationsObservableContext } from '../../core/notifications-observable/context/interfaces';
import { IFiniteStateObservableContext } from './context/interfaces';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { KeyValueMapToNotifications } from '../../core/notifications-observable/types';
import { InitObservableHook } from '../../../core/observable/hook/init';
import { IObservableContextBase } from '../../../core/observable/context/base/interfaces';
import { HasFactoryWaterMark } from '../../../classes/class-helpers/factory';
import { NewFiniteStateObservableContext } from './context/implementation';
import {
  NormalizeFiniteStateObservableFinalStates, NormalizeFiniteStateObservableMode, NormalizeFiniteStateObservableModes
} from './functions';


/** CONSTRUCTOR **/

export function ConstructFiniteStateObservable<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>,
  context: INotificationsObservableContext<TKVMap>,
  create?: (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) => (IObservableHook<TValue> | void),
  options: IFiniteStateObservableOptions<TFinalState, TMode> = {}
): void {
  ConstructClassWithPrivateMembers(instance, FINITE_STATE_OBSERVABLE_PRIVATE);
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE];

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
    && value.hasOwnProperty(FINITE_STATE_OBSERVABLE_PRIVATE as symbol);
}

export const IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-observable-constructor');

export function IsFiniteStateObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_COMPLETE_STATE_OBSERVABLE_CONSTRUCTOR);
}

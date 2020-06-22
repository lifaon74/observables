import { Observable as RXObservable } from 'rxjs';
import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import {
  FromRXJSObservableKeyValueMap, IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableOptions,
  TFromRXJSObservableConstructorArgs, TFromRXJSObservableFinalState, TFromRXJSObservableMode
} from './interfaces';
import { IsObject } from '../../../../../../helpers';
import { FiniteStateObservableFactory } from '../../../implementation';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { IObservableConstructor } from '../../../../../../core/observable/interfaces';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { GenerateFiniteStateObservableHookFromRXJS } from './hook-generators';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { IsFiniteStateObservableConstructor } from '../../../constructor';
import {
  BaseClass, ConstructClassWithPrivateMembers, Constructor, GenerateOverrideSuperArgumentsFunction, HasFactoryWaterMark,
  IBaseClassConstructor, MakeFactory, OwnArguments, SuperArguments
} from '@lifaon/class-factory';
import { TFiniteStateObservableConstructorArgs } from '../../../types';


export const FROM_RXJS_OBSERVABLE_PRIVATE = Symbol('from-rxjs-observable-private');

export interface IFromRXJSObservablePrivate<T> {
}

export interface IFromRXJSObservableInternal<T> extends IFromRXJSObservable<T> {
  [FROM_RXJS_OBSERVABLE_PRIVATE]: IFromRXJSObservablePrivate<T>;
}

export function ConstructFromRXJSObservable<T>(
  instance: IFromRXJSObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_RXJS_OBSERVABLE_PRIVATE);
}

export function IsFromRXJSObservable(value: any): value is IFromRXJSObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_RXJS_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-rxjs-observable-constructor');

export function IsFromRXJSObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR);
}


export function PureFromRXJSObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromRXJSObservableFinalState, TFromRXJSObservableMode, FromRXJSObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;

  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }

  const overrideFiniteStateObservableArguments = GenerateOverrideSuperArgumentsFunction<TFiniteStateObservableConstructorArgs<T, TFromRXJSObservableFinalState, TFromRXJSObservableMode, FromRXJSObservableKeyValueMap<T>>>(
    superClass,
    IsFiniteStateObservableConstructor
  );

  return class FromRXJSObservable extends superClass implements IFromRXJSObservable<T> {
    constructor(...args: any[]) {
      const [rxObservable, options]: TFromRXJSObservableConstructorArgs<T> = OwnArguments<TFromRXJSObservableConstructorArgs<T>>(args);
      super(...overrideFiniteStateObservableArguments(SuperArguments(args), () => [
        GenerateFiniteStateObservableHookFromRXJS<T>(rxObservable),
        options
      ]));
      ConstructFromRXJSObservable<T>(this);
    }
  };
}

export let FromRXJSObservable: IFromRXJSObservableConstructor;

export function FromRXJSObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromRXJSObservableFinalState, TFromRXJSObservableMode, FromRXJSObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [], TBase>(PureFromRXJSObservableFactory, [], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromRXJSObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [
    IFiniteStateObservableTypedConstructor<any, TFromRXJSObservableFinalState, TFromRXJSObservableMode, FromRXJSObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<FromRXJSObservableKeyValueMap<any>>,
    IObservableConstructor
  ], TBase>(PureFromRXJSObservableFactory, [FiniteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR],
  });
}

FromRXJSObservable = class FromRXJSObservable extends FromRXJSObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(rxObservable: RXObservable<any>, options?: IFromRXJSObservableOptions) {
    super([rxObservable, options], [], [], []);
  }
} as IFromRXJSObservableConstructor;

import { Observable as RXObservable } from 'rxjs';
import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import {
  FromRXJSObservableKeyValueMap, IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableOptions,
  TFromRXJSObservableConstructorArgs, TFromRXJSObservableFinalState, TFromRXJSObservableMode
} from './interfaces';
import { IsObject } from '../../../../../helpers';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../classes/class-helpers/factory';
import { FiniteStateObservableSoftFactory, IsFiniteStateObservableConstructor } from '../../implementation';
import { INotificationsObservableTypedConstructor } from '../../../../core/notifications-observable/interfaces';
import { IObservableConstructor } from '../../../../../core/observable/interfaces';
import { NotificationsObservableFactory } from '../../../../core/notifications-observable/implementation';
import { ObservableFactory } from '../../../../../core/observable/implementation';
import { GenerateFiniteStateObservableHookFromRXJS } from './hook-generators';
import { Constructor } from '../../../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../../../classes/class-helpers/base-class';


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
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromRXJSObservable extends superClass implements IFromRXJSObservable<T> {
    constructor(...args: any[]) {
      const [rxObservable, options]: TFromRXJSObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
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
  ], TBase>(PureFromRXJSObservableFactory, [FiniteStateObservableSoftFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
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

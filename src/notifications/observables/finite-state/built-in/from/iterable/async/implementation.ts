import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../../interfaces';
import {
  IFromAsyncIterableObservable, IFromAsyncIterableObservableConstructor, IFromAsyncIterableObservableKeyValueMap,
  IFromAsyncIterableObservableOptions, TFromAsyncIterableObservableConstructorArgs,
  TFromAsyncIterableObservableFinalState, TFromAsyncIterableObservableMode
} from './interfaces';
import { FiniteStateObservableFactory} from '../../../../implementation';
import { IObservableConstructor } from '../../../../../../../core/observable/interfaces';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../../../classes/class-helpers/factory';
import { ConstructClassWithPrivateMembers } from '../../../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../../../helpers';
import { NotificationsObservableFactory } from '../../../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../../../core/notifications-observable/interfaces';
import { GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow } from '../hook-generators';
import { Constructor } from '../../../../../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../../../../../classes/class-helpers/base-class';
import { ObservableFactory } from '../../../../../../../core/observable/implementation';
import { IsFiniteStateObservableConstructor } from '../../../../constructor';


export const FROM_ASYNC_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-async-iterable-observable-private');

export interface IFromAsyncIterableObservablePrivate<T> {
}

export interface IFromAsyncIterableObservableInternal<T> extends IFromAsyncIterableObservable<T> {
  [FROM_ASYNC_ITERABLE_OBSERVABLE_PRIVATE]: IFromAsyncIterableObservablePrivate<T>;
}

export function ConstructFromAsyncIterableObservable<T>(
  instance: IFromAsyncIterableObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_ASYNC_ITERABLE_OBSERVABLE_PRIVATE);
}

export function IsFromAsyncIterableObservable(value: any): value is IFromAsyncIterableObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_ASYNC_ITERABLE_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_ASYNC_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-async-iterable-observable-constructor');

export function IsFromAsyncIterableObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ASYNC_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}

export function PureFromAsyncIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromAsyncIterableObservableFinalState, TFromAsyncIterableObservableMode, IFromAsyncIterableObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromAsyncIterableObservable extends superClass implements IFromAsyncIterableObservable<T> {
    constructor(...args: any[]) {
      const [iterable, options]: TFromAsyncIterableObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        GenerateFiniteStateObservableHookFromAsyncIterableWithPauseWorkflow<T>(iterable),
        options
      ]));
      ConstructFromAsyncIterableObservable<T>(this);
    }
  };
}

export let FromAsyncIterableObservable: IFromAsyncIterableObservableConstructor;

export function FromAsyncIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromAsyncIterableObservableFinalState, TFromAsyncIterableObservableMode, IFromAsyncIterableObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromAsyncIterableObservableConstructor, [], TBase>(PureFromAsyncIterableObservableFactory, [], superClass, {
    name: 'FromAsyncIterableObservable',
    instanceOf: FromAsyncIterableObservable,
    waterMarks: [IS_FROM_ASYNC_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}


export function FromAsyncIterableObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromAsyncIterableObservableConstructor, [
    IFiniteStateObservableTypedConstructor<any, TFromAsyncIterableObservableFinalState, TFromAsyncIterableObservableMode, IFromAsyncIterableObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<IFromAsyncIterableObservableKeyValueMap<any>>,
    IObservableConstructor
  ], TBase>(PureFromAsyncIterableObservableFactory, [FiniteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromAsyncIterableObservable',
    instanceOf: FromAsyncIterableObservable,
    waterMarks: [IS_FROM_ASYNC_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

FromAsyncIterableObservable = class FromAsyncIterableObservable extends FromAsyncIterableObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(iterable: AsyncIterable<any>, options?: IFromAsyncIterableObservableOptions) {
    super([iterable, options], [], [], []);
  }
} as IFromAsyncIterableObservableConstructor;

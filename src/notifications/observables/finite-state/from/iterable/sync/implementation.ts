import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import {
  IFromIterableObservable, IFromIterableObservableConstructor, IFromIterableObservableKeyValueMap,
  IFromIterableObservableOptions, TFromIterableObservableConstructorArgs, TFromIterableObservableFinalState,
  TFromIterableObservableMode
} from './interfaces';
import { FiniteStateObservableFactory, IsFiniteStateObservableConstructor } from '../../../implementation';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { IObservableConstructor } from '../../../../../../core/observable/interfaces';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../../classes/factory';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../../helpers';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow } from '../hook-generators';


export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<T> {
}

export interface IFromIterableObservableInternal<T> extends IFromIterableObservable<T> {
  [FROM_ITERABLE_OBSERVABLE_PRIVATE]: IFromIterableObservablePrivate<T>;
}

export function ConstructFromIterableObservable<T>(
  instance: IFromIterableObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_ITERABLE_OBSERVABLE_PRIVATE);
}

export function IsFromIterableObservable(value: any): value is IFromIterableObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_ITERABLE_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');

export function IsFromIterableObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}

export function PureFromIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromIterableObservable extends superClass implements IFromIterableObservable<T> {
    constructor(...args: any[]) {
      const [iterable, options]: TFromIterableObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<T>(iterable),
        options
      ]));
      ConstructFromIterableObservable<T>(this);
    }
  };
}

export let FromIterableObservable: IFromIterableObservableConstructor;

export function FromIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [], TBase>(PureFromIterableObservableFactory, [], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromIterableObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [
    IFiniteStateObservableTypedConstructor<any, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<IFromIterableObservableKeyValueMap<any>>,
    IObservableConstructor
    ], TBase>(PureFromIterableObservableFactory, [FiniteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

FromIterableObservable = class FromIterableObservable extends FromIterableObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(iterable: Iterable<any>, options?: IFromIterableObservableOptions) {
    super([iterable, options], [], [], []);
  }
} as IFromIterableObservableConstructor;

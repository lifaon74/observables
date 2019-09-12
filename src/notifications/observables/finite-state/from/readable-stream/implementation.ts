import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../interfaces';
import {
  IFromReadableStreamObservable, IFromReadableStreamObservableConstructor, IFromReadableStreamObservableKeyValueMap,
  IFromReadableStreamObservableOptions, TFromReadableStreamObservableConstructorArgs,
  TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode
} from './interfaces';
import { FiniteStateObservableSoftFactory, IsFiniteStateObservableConstructor } from '../../implementation';
import { ObservableFactory } from '../../../../../core/observable/implementation';
import { IObservableConstructor } from '../../../../../core/observable/interfaces';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../classes/factory';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../helpers';
import { NotificationsObservableFactory } from '../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../core/notifications-observable/interfaces';
import { GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow } from './hook-generators';


export const FROM_READABLE_STREAM_OBSERVABLE_PRIVATE = Symbol('from-readable-stream-observable-private');

export interface IFromReadableStreamObservablePrivate<T> {
}

export interface IFromReadableStreamObservableInternal<T> extends IFromReadableStreamObservable<T> {
  [FROM_READABLE_STREAM_OBSERVABLE_PRIVATE]: IFromReadableStreamObservablePrivate<T>;
}

export function ConstructFromReadableStreamObservable<T>(
  instance: IFromReadableStreamObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_READABLE_STREAM_OBSERVABLE_PRIVATE);
}

export function IsFromReadableStreamObservable(value: any): value is IFromReadableStreamObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_READABLE_STREAM_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_READABLE_STREAM_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');

export function IsFromReadableStreamObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_READABLE_STREAM_CONSTRUCTOR);
}

export function PureFromReadableStreamObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromReadableStreamObservable extends superClass implements IFromReadableStreamObservable<T> {
    constructor(...args: any[]) {
      const [reader, options]: TFromReadableStreamObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<T>(reader),
        options
      ]));
      ConstructFromReadableStreamObservable<T>(this);
    }
  };
}

export let FromReadableStreamObservable: IFromReadableStreamObservableConstructor;

export function FromReadableStreamObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromReadableStreamObservableConstructor, [], TBase>(PureFromReadableStreamObservableFactory, [], superClass, {
    name: 'FromReadableStreamObservable',
    instanceOf: FromReadableStreamObservable,
    waterMarks: [IS_FROM_READABLE_STREAM_CONSTRUCTOR],
  });
}

export function FromReadableStreamObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromReadableStreamObservableConstructor, [
    IFiniteStateObservableTypedConstructor<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<IFromReadableStreamObservableKeyValueMap<any>>,
    IObservableConstructor
  ], TBase>(PureFromReadableStreamObservableFactory, [FiniteStateObservableSoftFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromReadableStreamObservable',
    instanceOf: FromReadableStreamObservable,
    waterMarks: [IS_FROM_READABLE_STREAM_CONSTRUCTOR],
  });
}

FromReadableStreamObservable = class FromReadableStreamObservable extends FromReadableStreamObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(reader: ReadableStreamReader<any>, options?: IFromReadableStreamObservableOptions) {
    super([reader, options], [], [], []);
  }
} as IFromReadableStreamObservableConstructor;

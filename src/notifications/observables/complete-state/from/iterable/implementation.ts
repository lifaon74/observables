import {
  ICompleteStateObservable, ICompleteStateObservableContext, ICompleteStateObservableTypedConstructor
} from '../../interfaces';
import {
  FromIterableObservableEventsMap, IFromIterableObservable, IFromIterableObservableConstructor,
  IFromIterableObservableOptions, TFromIterableObservableConstructorArgs
} from './interfaces';
import { CompleteStateObservableFactory, IsCompleteStateObservableConstructor } from '../../implementation';
import { ObservableFactory } from '../../../../../core/observable/implementation';
import { IObservableConstructor } from '../../../../../core/observable/interfaces';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../classes/factory';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../helpers';
import { NotificationsObservableFactory } from '../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../core/notifications-observable/interfaces';


export const FROM_ITERABLE_OBSERVABLE_PRIVATE = Symbol('from-iterable-observable-private');

export interface IFromIterableObservablePrivate<T> {
  context: ICompleteStateObservableContext<T, FromIterableObservableEventsMap<T>>;
  iterable: Iterable<T>;
}

export interface IFromIterableObservableInternal<T> extends IFromIterableObservable<T> {
  [FROM_ITERABLE_OBSERVABLE_PRIVATE]: IFromIterableObservablePrivate<T>;
}

export function ConstructFromIterableObservable<T>(
  instance: IFromIterableObservable<T>,
  context: ICompleteStateObservableContext<T, FromIterableObservableEventsMap<T>>,
  iterable: Iterable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_ITERABLE_OBSERVABLE_PRIVATE);
  const privates: IFromIterableObservablePrivate<T> = (instance as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.iterable = iterable;
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


export function FromIterableObservableOnObserved<T>(instance: IFromIterableObservable<T>): void {
  const privates: IFromIterableObservablePrivate<T> = (instance as IFromIterableObservableInternal<T>)[FROM_ITERABLE_OBSERVABLE_PRIVATE];
  if (
    (instance.observers.length === 1) // optional check
    && (instance.state === 'emitting')
  ) {
    const iterator: Iterator<T> = privates.iterable[Symbol.iterator]();
    let result: IteratorResult<T>;
    while (!(result = iterator.next()).done) {
      privates.context.next(result.value);
    }
    privates.context.complete();
  }
}

export function PureFromIterableObservableFactory<TBase extends Constructor<ICompleteStateObservable<any, FromIterableObservableEventsMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsCompleteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected CompleteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromIterableObservable extends superClass implements IFromIterableObservable<T> {
    constructor(...args: any[]) {
      const [iterable, onCompleteOptions]: TFromIterableObservableConstructorArgs<T> = args[0];
      let context: ICompleteStateObservableContext<T, FromIterableObservableEventsMap<T>>;
      super(...setSuperArgs(args.slice(1), [
        (_context: ICompleteStateObservableContext<T, FromIterableObservableEventsMap<T>>) => {
          context = _context;
          return {
            onObserved(): void {
              FromIterableObservableOnObserved<T>(this);
            }
          };
        }, onCompleteOptions
      ]));
      // @ts-ignore
      ConstructFromIterableObservable<T>(this, context, iterable);
    }
  };
}

export let FromIterableObservable: IFromIterableObservableConstructor;

export function FromIterableObservableFactory<TBase extends Constructor<ICompleteStateObservable<any>>>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [], TBase>(PureFromIterableObservableFactory, [], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromIterableObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableConstructor, [
    ICompleteStateObservableTypedConstructor<any, FromIterableObservableEventsMap<any>>,
    INotificationsObservableTypedConstructor<FromIterableObservableEventsMap<any>>,
    IObservableConstructor
    ], TBase>(PureFromIterableObservableFactory, [CompleteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR,],
  });
}

FromIterableObservable = class FromIterableObservable extends FromIterableObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(iterable: Iterable<any>, options?: IFromIterableObservableOptions) {
    super([iterable, options], [], [], []);
  }
} as IFromIterableObservableConstructor;

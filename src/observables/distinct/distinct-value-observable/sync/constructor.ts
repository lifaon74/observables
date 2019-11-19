import { HasFactoryWaterMark } from '../../../../classes/class-helpers/factory';
import { IDistinctValueObservable } from './interfaces';
import { IObservableContext } from '../../../../core/observable/context/interfaces';
import { IDistinctValueObservableContext } from './context/interfaces';
import { IObservableHook } from '../../../../core/observable/hook/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import {
  DISTINCT_VALUE_OBSERVABLE_PRIVATE, IDistinctValueObservableInternal, IDistinctValueObservablePrivate
} from './privates';
import { IObserver } from '../../../../core/observer/interfaces';
import { InitObservableHook } from '../../../../core/observable/hook/init';
import { IsObject } from '../../../../helpers';
import { NewDistinctValueObservableContext } from './context/implementation';

/** CONSTRUCTOR **/

export function ConstructDistinctValueObservable<T>(
  instance: IDistinctValueObservable<T>,
  context: IObservableContext<T>,
  create?: (context: IDistinctValueObservableContext<T>) => IObservableHook<T> | void
): void {
  ConstructClassWithPrivateMembers(instance, DISTINCT_VALUE_OBSERVABLE_PRIVATE);
  const privates: IDistinctValueObservablePrivate<T> = (instance as IDistinctValueObservableInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE];
  privates.context = context;
  // privates.value = void 0;
  privates.count = 0;
  privates.lastCountPerObserver = new WeakMap<IObserver<T>, number>();

  InitObservableHook(
    instance,
    privates,
    NewDistinctValueObservableContext,
    create,
  );
}

export function IsDistinctValueObservable(value: any): value is IDistinctValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(DISTINCT_VALUE_OBSERVABLE_PRIVATE as symbol);
}

export const IS_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-value-observable-constructor');

export function IsDistinctValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_VALUE_OBSERVABLE_CONSTRUCTOR);
}

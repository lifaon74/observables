import { HasFactoryWaterMark } from '../../../../classes/class-helpers/factory';
import { IAsyncDistinctValueObservable } from './interfaces';
import { IDistinctValueObservableContext } from '../sync/context/interfaces';
import { IAsyncDistinctValueObservableContext } from './context/interfaces';
import { IObservableHook } from '../../../../core/observable/hook/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import {
  DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE, IAsyncDistinctValueObservableInternal, IAsyncDistinctValueObservablePrivate
} from './privates';
import { InitObservableHook } from '../../../../core/observable/hook/init';
import { NewAsyncDistinctValueObservableContext } from './context/implementation';
import { IsObject } from '../../../../helpers';

/** CONSTRUCTOR **/

export function ConstructAsyncDistinctValueObservable<T>(
  instance: IAsyncDistinctValueObservable<T>,
  context: IDistinctValueObservableContext<T>,
  create?: (context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)
): void {
  ConstructClassWithPrivateMembers(instance, DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE);
  const privates: IAsyncDistinctValueObservablePrivate<T> = (instance as IAsyncDistinctValueObservableInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE];

  privates.context = context;
  privates.promise = null;
  privates.controller = null;

  InitObservableHook(
    instance,
    privates,
    NewAsyncDistinctValueObservableContext,
    create,
  );
}

export function IsAsyncDistinctValueObservable(value: any): value is IAsyncDistinctValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE as symbol);
}

export const IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-async-value-observable-constructor');

export function IsAsyncDistinctValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR);
}

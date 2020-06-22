import { IObservable, IObservableConstructor } from './interfaces';
import { IsObject } from '../../helpers';
import { IObservableInternal, IObservablePrivate, OBSERVABLE_PRIVATE } from './privates';
import { IObservableHook } from './hook/interfaces';
import { IObservableContext } from './context/interfaces';
import { NewObservableContext } from './context/implementation';
import { InitObservableHook } from './hook/init';
import { ConstructClassWithPrivateMembers, HasFactoryWaterMark } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructObservable<T>(
  instance: IObservable<T>,
  create?: (context: IObservableContext<T>) => (IObservableHook<T> | void),
): void {
  ConstructClassWithPrivateMembers(instance, OBSERVABLE_PRIVATE);
  const privates: IObservablePrivate<T> = (instance as IObservableInternal<T>)[OBSERVABLE_PRIVATE];
  privates.observers = [];

  InitObservableHook(
    instance,
    privates,
    NewObservableContext,
    create,
  );
}

export function IsObservable<T = any>(value: any): value is IObservable<T> {
  return IsObject(value)
    && value.hasOwnProperty(OBSERVABLE_PRIVATE as symbol);
}

export const IS_OBSERVABLE_CONSTRUCTOR = Symbol('is-observable-constructor');

/**
 * Returns true if value is an Observable
 */
export function IsObservableConstructor(value: any, direct?: boolean): value is IObservableConstructor {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_OBSERVABLE_CONSTRUCTOR, direct);
}


export const IS_OBSERVABLE_LIKE_CONSTRUCTOR = Symbol('is-observable-constructor');

/**
 * Returns true if value is an ObservableConstructor (direct or indirect) and accepts same arguments than an Observable
 */
export function IsObservableLikeConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_OBSERVABLE_LIKE_CONSTRUCTOR, direct)
    && HasFactoryWaterMark(value, IS_OBSERVABLE_CONSTRUCTOR, false);
}

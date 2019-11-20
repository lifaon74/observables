import { IFromIterableObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import {
  FROM_ITERABLE_OBSERVABLE_PRIVATE, IFromIterableObservableInternal, IFromIterableObservablePrivate
} from './privates';
import { HasFactoryWaterMark } from '../../../../../../classes/class-helpers/factory';
import { IsObject } from '../../../../../../helpers';
import { TSyncOrAsyncIterable } from './types';
import { IFromIterableObservableNormalizedArguments } from './functions';

/** CONSTRUCTOR **/

export function ConstructFromIterableObservable<TIterable extends TSyncOrAsyncIterable<any>>(
  instance: IFromIterableObservable<TIterable>,
  args: IFromIterableObservableNormalizedArguments<TIterable>
): void {
  ConstructClassWithPrivateMembers(instance, FROM_ITERABLE_OBSERVABLE_PRIVATE);
  const privates: IFromIterableObservablePrivate<TIterable> = (instance as IFromIterableObservableInternal<TIterable>)[FROM_ITERABLE_OBSERVABLE_PRIVATE];

  privates.iterable = args.iterable;
  privates.isAsync = args.isAsync;
}

export function IsFromIterableObservable(value: any): value is IFromIterableObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_ITERABLE_OBSERVABLE_PRIVATE as symbol);
}

export const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');

export function IsFromIterableObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}

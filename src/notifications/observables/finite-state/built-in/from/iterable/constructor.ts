import { IFromIterableObservable } from './interfaces';
import {
  FROM_ITERABLE_OBSERVABLE_PRIVATE, IFromIterableObservableInternal, IFromIterableObservablePrivate
} from './privates';
import { IsObject } from '../../../../../../helpers';
import { IFromIterableObservableNormalizedArguments } from './functions';
import { TSyncOrAsyncIterable } from '../../../../../../misc/helpers/iterators/interfaces';
import { ConstructClassWithPrivateMembers, HasFactoryWaterMark } from '@lifaon/class-factory';

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

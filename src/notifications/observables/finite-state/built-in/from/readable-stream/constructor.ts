import { IFromReadableStreamObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';
import { FROM_READABLE_STREAM_OBSERVABLE_PRIVATE } from './privates';
import { IsObject } from '../../../../../../helpers';
import { HasFactoryWaterMark } from '../../../../../../classes/class-helpers/factory';

/** CONSTRUCTOR **/

export function ConstructFromReadableStreamObservable<T>(
  instance: IFromReadableStreamObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, FROM_READABLE_STREAM_OBSERVABLE_PRIVATE);
}

export function IsFromReadableStreamObservable(value: any): value is IFromReadableStreamObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_READABLE_STREAM_OBSERVABLE_PRIVATE as symbol);
}

export const IS_FROM_READABLE_STREAM_CONSTRUCTOR = Symbol('is-from-iterable-observable-constructor');

export function IsFromReadableStreamObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_READABLE_STREAM_CONSTRUCTOR);
}

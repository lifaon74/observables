import { IPromiseObservable } from './interfaces';
import { IsObject } from '../../../../../../helpers';
import { PROMISE_OBSERVABLE_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '../../../../../../misc/helpers/ClassWithPrivateMembers';

/** CONSTRUCTOR **/

export function ConstructPromiseObservable<T>(
  instance: IPromiseObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, PROMISE_OBSERVABLE_PRIVATE);
}

export function IsPromiseObservable(value: any): value is IPromiseObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(PROMISE_OBSERVABLE_PRIVATE as symbol);
}

import { IPreventable } from './interfaces';
import { IsObject } from '../../../helpers';
import { IPreventableInternal, PREVENTABLE_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';

/** CONSTRUCTOR **/

export function ConstructPreventable<N extends string>(instance: IPreventable<N>): void {
  ConstructClassWithPrivateMembers(instance, PREVENTABLE_PRIVATE);
  (instance as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented = new Set<N>();
}

export function IsPreventable(value: any): value is IPreventable<string> {
  return IsObject(value)
    && value.hasOwnProperty(PREVENTABLE_PRIVATE as symbol);
}

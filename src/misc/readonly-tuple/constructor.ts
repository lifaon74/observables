import { IReadonlyTuple } from './interfaces';
import { IsObject } from '../../helpers';
import { IReadonlyTupleInternal, READONLY_TUPLE_PRIVATE } from './privates';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructReadonlyTuple<TTuple extends any[]>(instance: IReadonlyTuple<TTuple>, tuple: TTuple): void {
  ConstructClassWithPrivateMembers(instance, READONLY_TUPLE_PRIVATE);
  if (Array.isArray(tuple)) {
    (instance as IReadonlyTupleInternal<TTuple>)[READONLY_TUPLE_PRIVATE].items = tuple;
  } else {
    throw new TypeError(`Expected array as tuple`);
  }
}

export function IsReadonlyTuple(value: any): value is IReadonlyTuple<any> {
  return IsObject(value)
    && value.hasOwnProperty(READONLY_TUPLE_PRIVATE as symbol);
}

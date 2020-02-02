import { IReadonlyTuple } from './interfaces';

/** PRIVATES **/

export const READONLY_TUPLE_PRIVATE = Symbol('readonly-tuple-private');

export interface IReadonlyTuplePrivate<TTuple extends any[]> {
  items: TTuple;
}

export interface IReadonlyTuplePrivatesInternal<TTuple extends any[]> {
  [READONLY_TUPLE_PRIVATE]: IReadonlyTuplePrivate<TTuple>;
}

export interface IReadonlyTupleInternal<TTuple extends any[]> extends IReadonlyTuplePrivatesInternal<TTuple>, IReadonlyTuple<TTuple> {
}

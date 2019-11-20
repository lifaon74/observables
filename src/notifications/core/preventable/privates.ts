import { IPreventable } from './interfaces';

/** PRIVATES **/

export const PREVENTABLE_PRIVATE = Symbol('preventable-private');

export interface IPreventablePrivate<N extends string> {
  prevented: Set<N>;
}

export interface IPreventablePrivatesInternal<N extends string> {
  [PREVENTABLE_PRIVATE]: IPreventablePrivate<N>;
}

export interface IPreventableInternal<N extends string> extends IPreventablePrivatesInternal<N>, IPreventable<N> {
}

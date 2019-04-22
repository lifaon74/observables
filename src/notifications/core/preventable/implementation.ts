import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IPreventable, TDefaultPreventable } from './interfaces';

export const PREVENTABLE_PRIVATE = Symbol('preventable-private');

export interface IPreventablePrivate<N extends TDefaultPreventable> {
  prevented: Set<N>;
}

export interface IPreventableInternal<N extends TDefaultPreventable> extends IPreventable<N> {
  [PREVENTABLE_PRIVATE]: IPreventablePrivate<N>;
}

export function ConstructPreventable<N extends TDefaultPreventable>(preventable: IPreventable<N>): void {
  ConstructClassWithPrivateMembers(preventable, PREVENTABLE_PRIVATE);
  (preventable as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented = new Set<N>();
}



export class Preventable<N extends TDefaultPreventable = 'default'> implements IPreventable<N> {

  constructor() {
    ConstructPreventable<N>(this);
  }

  isPrevented(name: N = ('default' as N)): boolean {
    return ((this as unknown) as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.has(name);
  }

  prevent(name: N = ('default' as N)): this {
    ((this as unknown) as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.add(name);
    return this;
  }
}

import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IBasicPreventable, IPreventable } from './interfaces';

export const PREVENTABLE_PRIVATE = Symbol('preventable-private');

export interface IPreventablePrivate<N extends string> {
  prevented: Set<N>;
}

export interface IPreventableInternal<N extends string> extends IPreventable<N> {
  [PREVENTABLE_PRIVATE]: IPreventablePrivate<N>;
}

export function ConstructPreventable<N extends string>(preventable: IPreventable<N>): void {
  ConstructClassWithPrivateMembers(preventable, PREVENTABLE_PRIVATE);
  (preventable as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented = new Set<N>();
}



export class Preventable<N extends string> implements IPreventable<N> {

  constructor() {
    ConstructPreventable<N>(this);
  }

  isPrevented(name: N): boolean {
    return ((this as unknown) as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.has(name);
  }

  prevent(name: N): this {
    ((this as unknown) as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.add(name);
    return this;
  }
}


export class BasicPreventable extends Preventable<'default'> implements IBasicPreventable {

  constructor() {
    super();
  }

  isPrevented(): boolean {
    return super.isPrevented('default');
  }

  prevent(): this {
    return super.prevent('default');
  }
}

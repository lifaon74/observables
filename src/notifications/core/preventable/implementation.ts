import { IPreventable } from './interfaces';
import { IPreventableInternal, PREVENTABLE_PRIVATE } from './privates';
import { ConstructPreventable } from './constructor';

/** METHODS **/

export function PreventableIsPrevented<N extends string>(instance: IPreventable<N>, name: N): boolean {
  return (instance as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.has(name);
}

export function PreventablePrevent<N extends string>(instance: IPreventable<N>, name: N): void {
  (instance as IPreventableInternal<N>)[PREVENTABLE_PRIVATE].prevented.add(name);
}

/** CLASS **/

export class Preventable<N extends string> implements IPreventable<N> {

  constructor() {
    ConstructPreventable<N>(this);
  }

  isPrevented(name: N): boolean {
    return PreventableIsPrevented<N>(this, name);
  }

  prevent(name: N): this {
    PreventablePrevent<N>(this, name);
    return this;
  }
}

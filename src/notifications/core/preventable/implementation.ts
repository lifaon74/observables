import { IPreventable } from './interfaces';

export class Preventable<N extends string = 'default'> implements IPreventable<N> {
  protected _prevented: Set<N>;

  constructor() {
    this._prevented = new Set<N>();
  }

  isPrevented(name: N = ('default' as N)): boolean {
    return this._prevented.has(name);
  }

  prevent(name: N = ('default' as N)): void {
    this._prevented.add(name);
  }
}

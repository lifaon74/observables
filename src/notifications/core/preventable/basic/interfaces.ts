import { IPreventable } from '../interfaces';

/** INTERFACES **/

export interface IBasicPreventableConstructor {
  new(): IBasicPreventable;
}

/**
 * Like Preventable but 'name' is not required
 */
export interface IBasicPreventable extends IPreventable<'default'> {
  isPrevented(): boolean;

  prevent(): this;
}

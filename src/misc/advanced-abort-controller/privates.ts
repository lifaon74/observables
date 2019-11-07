import { IAdvancedAbortController } from './interfaces';
import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';

/** PRIVATES **/

export const ADVANCED_ABORT_CONTROLLER_PRIVATE = Symbol('advanced-abort-controller-private');

export interface IAdvancedAbortControllerPrivate {
  signal: IAdvancedAbortSignal;
}

export interface IAdvancedAbortControllerPrivatesInternal {
  [ADVANCED_ABORT_CONTROLLER_PRIVATE]: IAdvancedAbortControllerPrivate;
}

export interface IAdvancedAbortControllerInternal extends IAdvancedAbortControllerPrivatesInternal, IAdvancedAbortController {
}

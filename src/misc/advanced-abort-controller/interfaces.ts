import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';

/** INSTANCE **/

/* PRIVATE */

export interface IAdvancedAbortControllerConstructor {
  new(): IAdvancedAbortController;
}

export interface IAdvancedAbortController {
  readonly signal: IAdvancedAbortSignal;

  abort(reason?: any): void;
}



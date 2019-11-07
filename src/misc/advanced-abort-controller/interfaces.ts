import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';

/** INSTANCE **/

/* PRIVATE */

export interface IAdvancedAbortControllerConstructor {
  fromAbortSignal(signal: AbortSignal): IAdvancedAbortController;

  new(): IAdvancedAbortController;
}

export interface IAdvancedAbortController {
  readonly signal: IAdvancedAbortSignal;

  abort(reason?: any): void;
}



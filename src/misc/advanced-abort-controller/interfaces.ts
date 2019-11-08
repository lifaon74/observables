import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';

/** INSTANCE **/

/* PRIVATE */

export interface IAdvancedAbortControllerConstructor {
  /**
   * Returns a new AdvancedAbortController, automatically aborted if one of the 'signals' is aborted
   */
  fromAbortSignals(...signals: (AbortSignal | IAdvancedAbortSignal)[]): IAdvancedAbortController;

  new(): IAdvancedAbortController;
}

export interface IAdvancedAbortController {
  readonly signal: IAdvancedAbortSignal;

  abort(reason?: any): void;
}



import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';
import { TAbortSignalLikeOrUndefined } from './types';

/** INSTANCE **/

export interface IAdvancedAbortControllerConstructor {
  /**
   * Returns a new AdvancedAbortController, automatically aborted if one of the 'signals' is aborted
   */
  fromAbortSignals(...signals: TAbortSignalLikeOrUndefined[]): IAdvancedAbortController;

  timeout(timeout: number, signal?: IAdvancedAbortSignal): IAdvancedAbortController;

  new(): IAdvancedAbortController;
}

export interface IAdvancedAbortController {
  readonly signal: IAdvancedAbortSignal;

  /**
   * Aborts the signal
   */
  abort(reason?: any): void;
}




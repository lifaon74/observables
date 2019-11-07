import { IAdvancedAbortController } from './interfaces';
import { ADVANCED_ABORT_CONTROLLER_PRIVATE, IAdvancedAbortControllerInternal } from './privates';
import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';
import { ConstructAdvancedAbortController } from './constructor';
import { AdvancedAbortSignalAbort } from './advanced-abort-signal/functions';


/** METHODS **/

/* GETTERS/SETTERS */

export function AdvancedAbortControllerGetSignal(instance: IAdvancedAbortController): IAdvancedAbortSignal {
  return (instance as IAdvancedAbortControllerInternal)[ADVANCED_ABORT_CONTROLLER_PRIVATE].signal;
}

/* METHODS */

export function AdvancedAbortControllerAbort(instance: IAdvancedAbortController, reason?: any): void {
  AdvancedAbortSignalAbort((instance as IAdvancedAbortControllerInternal)[ADVANCED_ABORT_CONTROLLER_PRIVATE].signal, reason);
}

/** CLASS **/

export class AdvancedAbortController implements IAdvancedAbortController {

  constructor() {
    ConstructAdvancedAbortController(this);
  }

  get signal(): IAdvancedAbortSignal {
    return AdvancedAbortControllerGetSignal(this);
  }

  abort(reason?: any): void {
    return AdvancedAbortControllerAbort(this);
  }
}

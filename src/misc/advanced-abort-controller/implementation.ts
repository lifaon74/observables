import { IAdvancedAbortController, IAdvancedAbortControllerConstructor } from './interfaces';
import { ADVANCED_ABORT_CONTROLLER_PRIVATE, IAdvancedAbortControllerInternal } from './privates';
import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';
import { ConstructAdvancedAbortController } from './constructor';
import { AdvancedAbortSignalAbort } from './advanced-abort-signal/functions';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { AbortReason } from './abort-reason';


/** METHODS **/

/* GETTERS/SETTERS */

export function AdvancedAbortControllerGetSignal(instance: IAdvancedAbortController): IAdvancedAbortSignal {
  return (instance as IAdvancedAbortControllerInternal)[ADVANCED_ABORT_CONTROLLER_PRIVATE].signal;
}

/* METHODS */

export function AdvancedAbortControllerAbort(instance: IAdvancedAbortController, reason?: any): void {
  AdvancedAbortSignalAbort((instance as IAdvancedAbortControllerInternal)[ADVANCED_ABORT_CONTROLLER_PRIVATE].signal, reason);
}

/* STATIC METHODS */

export function AdvancedAbortControllerFromAbortSignal(_constructor: IAdvancedAbortControllerConstructor, signal: AbortSignal): IAdvancedAbortController {
  const instance: IAdvancedAbortController = new _constructor();

  if (signal.aborted) {
    if (!instance.signal.aborted) {
      instance.abort(new AbortReason(`AbortSignal aborted`));
    }
  } else {
    const clear = () => {
      signal.removeEventListener('abort', onSignalAborted, false);
      signalListener.deactivate();
    };

    const onSignalAborted = () => {
      clear();
      instance.abort(new AbortReason(`AbortSignal aborted`));
    };

    // in the case of our instance.signal is aborted, it's no more required to listen to 'abort' from input 'signal'
    const signalListener: INotificationsObserver<'abort', any> = instance.signal.addListener('abort', clear);
    signalListener.activate();

    signal.addEventListener('abort', onSignalAborted, false);
  }

  return instance;
}




/** CLASS **/

export class AdvancedAbortController implements IAdvancedAbortController {

  static fromAbortSignal(signal: AbortSignal): IAdvancedAbortController {
    return AdvancedAbortControllerFromAbortSignal(this, signal);
  }

  constructor() {
    ConstructAdvancedAbortController(this);
  }

  get signal(): IAdvancedAbortSignal {
    return AdvancedAbortControllerGetSignal(this);
  }

  abort(reason?: any): void {
    return AdvancedAbortControllerAbort(this, reason);
  }
}

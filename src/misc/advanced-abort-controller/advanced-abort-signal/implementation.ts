import { NotificationsObservable } from '../../../notifications/core/notifications-observable/implementation';
import { INotificationsObservableContext } from '../../../notifications/core/notifications-observable/context/interfaces';
import { IAdvancedAbortSignal, IAdvancedAbortSignalConstructor, IAdvancedAbortSignalKeyValueMap } from './interfaces';
import { AllowAdvancedAbortSignalConstruct, ConstructAdvancedAbortSignal } from './constructor';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal } from './privates';
import { INotificationsObserver } from '../../../notifications/core/notifications-observer/interfaces';



/** NEW **/

export function NewAdvancedAbortSignal(): IAdvancedAbortSignal {
  AllowAdvancedAbortSignalConstruct(true);
  const signal: IAdvancedAbortSignal = new (AdvancedAbortSignal as IAdvancedAbortSignalConstructor)();
  AllowAdvancedAbortSignalConstruct(false);
  return signal;
}

/** METHODS **/

/* GETTERS/SETTERS */

export function AdvancedAbortSignalGetAborted(instance: IAdvancedAbortSignal): boolean {
  return (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE].aborted;
}

export function AdvancedAbortSignalGetReason(instance: IAdvancedAbortSignal): any {
  return (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE].reason;
}

/* METHODS */

export function AdvancedAbortSignalToAbortController(instance: IAdvancedAbortSignal): AbortController {
  const controller: AbortController = new AbortController();

  if (instance.aborted) {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  } else {
    const clear = () => {
      controller.signal.removeEventListener('abort', clear, false);
      signalListener.deactivate();
    };

    const signalListener: INotificationsObserver<'abort', any> = instance.addListener('abort', () => {
      clear();
      controller.abort();
    });
    signalListener.activate();

    // in the case of controller.signal is aborted, it's no more required to listen to 'abort' from this signal
    controller.signal.addEventListener('abort', clear, false);
  }

  return controller;
}

/** CLASS **/

export class AdvancedAbortSignal extends NotificationsObservable<IAdvancedAbortSignalKeyValueMap> implements IAdvancedAbortSignal {

  protected constructor() {
    let context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>;
    super((_context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructAdvancedAbortSignal(this, context);
  }

  get aborted(): boolean {
    return AdvancedAbortSignalGetAborted(this);
  }

  get reason(): any {
    return AdvancedAbortSignalGetReason(this);
  }

  toAbortController(): AbortController {
    return AdvancedAbortSignalToAbortController(this);
  }
}

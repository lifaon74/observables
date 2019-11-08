import { IAdvancedAbortController, IAdvancedAbortControllerConstructor } from './interfaces';
import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';
import { ConstructAdvancedAbortController } from './constructor';
import { ADVANCED_ABORT_CONTROLLER_PRIVATE, IAdvancedAbortControllerInternal } from './privates';
import { AdvancedAbortSignalAbort } from './advanced-abort-signal/functions';
import { IsAdvancedAbortSignal } from './advanced-abort-signal/constructor';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { IBaseNotificationsObservable } from '../../notifications/core/notifications-observable/interfaces';
import { EventsObservable } from '../../notifications/observables/events/events-observable/public';
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

export function AdvancedAbortControllerFromAbortSignals(_constructor: IAdvancedAbortControllerConstructor, signals: (AbortSignal | IAdvancedAbortSignal)[]): IAdvancedAbortController {
  const instance: IAdvancedAbortController = new _constructor();

  const abort = (signal: (AbortSignal | IAdvancedAbortSignal)): void => {
    instance.abort(
      (signal instanceof AbortSignal)
        ? new AbortReason(`AbortSignal aborted`)
        : signal.reason
    );
  };

  for (let i = 0, l = signals.length; i < l; i++) {
    const signal: (AbortSignal | IAdvancedAbortSignal) = signals[i];
    if ((signal instanceof AbortSignal) || IsAdvancedAbortSignal(signal)) {
      if (signal.aborted) {
        abort(signal);
        return instance;
      }
    } else {
      throw new TypeError(`Expected AbortSignal or AdvancedAbortSignal at arguments #${ i } of AdvancedAbortController.fromAbortSignals`);
    }
  }

  /* no signal aborted yet */

  type TSignalObserver = INotificationsObserver<'abort', void>;
  type TSignalObservable = IBaseNotificationsObservable<'abort', void>;

  const signalObservers: TSignalObserver[] = signals.map((signal: (AbortSignal | IAdvancedAbortSignal)) => {
    const observable: TSignalObservable = (
      (signal instanceof AbortSignal)
        ? new EventsObservable<AbortSignalEventMap>(signal)
        : signal
    ) as TSignalObservable;
    return observable.addListener('abort', () => {
      clear();
      abort(signal);
    });
  });


  const clear = () => {
    for (let i = 0, l = signalObservers.length; i < l; i++) {
      signalObservers[i].deactivate();
    }
    signalListener.deactivate();
  };

  // in the case of our instance.signal is aborted, it's no more required to listen to 'abort' from input 'signal'
  const signalListener: INotificationsObserver<'abort', any> = instance.signal.addListener('abort', clear);

  // activate all
  for (let i = 0, l = signalObservers.length; i < l; i++) {
    signalObservers[i].activate();
  }
  signalListener.activate();

  return instance;
}


/** CLASS **/

export class AdvancedAbortController implements IAdvancedAbortController {

  static fromAbortSignals(...signals: (AbortSignal | IAdvancedAbortSignal)[]): IAdvancedAbortController {
    return AdvancedAbortControllerFromAbortSignals(this, signals);
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

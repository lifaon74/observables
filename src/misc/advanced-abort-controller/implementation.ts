import { IAdvancedAbortController, IAdvancedAbortControllerConstructor } from './interfaces';
import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';
import { ConstructAdvancedAbortController } from './constructor';
import { ADVANCED_ABORT_CONTROLLER_PRIVATE, IAdvancedAbortControllerInternal } from './privates';
import { AdvancedAbortSignalAbort } from './advanced-abort-signal/functions';
import { IsAdvancedAbortSignal } from './advanced-abort-signal/constructor';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { IBaseNotificationsObservable } from '../../notifications/core/notifications-observable/interfaces';
import { EventsObservable } from '../../notifications/observables/events/events-observable/public';
import { AbortReason } from '../reason/defaults/abort-reason';
import { $timeout } from './advanced-abort-signal/snipets';
import { TimeoutReason } from '../reason/defaults/timeout-reason';
import { TAbortSignalLike, TAbortSignalLikeOrUndefined } from './types';


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

export function AdvancedAbortControllerFromAbortSignals(_constructor: IAdvancedAbortControllerConstructor, signals: TAbortSignalLikeOrUndefined[]): IAdvancedAbortController {
  const instance: IAdvancedAbortController = new _constructor();

  const _signals: TAbortSignalLike[] = signals.filter((signal: TAbortSignalLikeOrUndefined, index: number): signal is TAbortSignalLike => {
    if (signal === void 0) {
      return false;
    } else if ((signal instanceof AbortSignal) || IsAdvancedAbortSignal(signal)) {
      return true;
    } else {
      throw new TypeError(`Expected AbortSignal, AdvancedAbortSignal or undefined at arguments #${ index } of AdvancedAbortController.fromAbortSignals`);
    }
  });

  const abort = (signal: (AbortSignal | IAdvancedAbortSignal)): void => {
    instance.abort(
      ('reason' in signal)
        ? signal.reason
        : new AbortReason(`AbortSignal aborted`)
    );
  };

  for (let i = 0, l = _signals.length; i < l; i++) {
    const signal: TAbortSignalLikeOrUndefined = _signals[i];
    if (signal.aborted) {
      abort(signal);
      return instance;
    }
  }

  /* no signal aborted yet */

  type TSignalObserver = INotificationsObserver<'abort', void>;
  type TSignalObservable = IBaseNotificationsObservable<'abort', void>;

  const signalObservers: TSignalObserver[] = _signals.map((signal: TAbortSignalLike) => {
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

export function AdvancedAbortControllerTimeout(_constructor: IAdvancedAbortControllerConstructor, timeout: number, signal?: IAdvancedAbortSignal): IAdvancedAbortController {
  const controller: AdvancedAbortController = new _constructor();
  $timeout(
    () => {
      controller.abort(new TimeoutReason());
    },
    timeout,
    AdvancedAbortControllerFromAbortSignals( // timeout cancelled as soon as 'controller' OR 'signal' is aborted
      _constructor,
      (signal === void 0)
        ? [controller.signal]
        : [controller.signal, signal]
    ).signal
  );

  return controller;
}

/** CLASS **/

export class AdvancedAbortController implements IAdvancedAbortController {

  static fromAbortSignals(...signals: TAbortSignalLikeOrUndefined[]): IAdvancedAbortController {
    return AdvancedAbortControllerFromAbortSignals(this, signals);
  }

  static timeout(timeout: number, signal?: IAdvancedAbortSignal): IAdvancedAbortController {
    return AdvancedAbortControllerTimeout(this, timeout, signal);
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

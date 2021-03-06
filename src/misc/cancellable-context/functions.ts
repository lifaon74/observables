import { IsObject } from '../../helpers';
import {
  ICancellableContextRegisterActivableNormalizedOptions, ICancellableContextRegisterActivableOptions,
  ICancellableContextRegisterCancellablePromiseNormalizedOptions, ICancellableContextRegisterCancellablePromiseOptions,
  TCancellableContextRegisterActivableOptionsMode, TCancellableContextRegisterCancellablePromiseOptionsMode
} from './types';
import { IActivableLike } from '../activable/interfaces';
import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
import { PromiseTry } from '../../promises/types/helpers';
import { ICancellablePromiseOptions } from '../../promises/cancellable-promise/types';
import { TAbortStrategy } from '../advanced-abort-controller/advanced-abort-signal/types';
import { TNativePromiseLikeOrValue } from '../../promises/types/native';
import { IAdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/interfaces';

/** FUNCTIONS **/


/* NORMALIZE: ICancellableContextRegisterActivableOptions */

export function NormalizeICancellableContextRegisterActivableOptionsMode(
  mode?: TCancellableContextRegisterActivableOptionsMode,
  defaultValue: TCancellableContextRegisterActivableOptionsMode = 'warn'
): TCancellableContextRegisterActivableOptionsMode {
  switch (mode) {
    case void 0:
      return defaultValue;
    case 'skip':
    case 'warn':
    case 'throw':
    case 'replace':
      return mode;
    default:
      throw new TypeError(`Expected 'skip', 'warn', 'throw', 'replace' or void as options.mode`);
  }
}

export function NormalizeICancellableContextRegisterActivableOptions(
  options: ICancellableContextRegisterActivableOptions = {},
  defaultValue?: ICancellableContextRegisterActivableNormalizedOptions
): ICancellableContextRegisterActivableNormalizedOptions {
  if (IsObject(options)) {
    return {
      ...options,
      mode: NormalizeICancellableContextRegisterActivableOptionsMode(options.mode, (defaultValue === void 0) ? void 0 : defaultValue.mode),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}


/* NORMALIZE: ICancellableContextRegisterCancellablePromiseOptions */

export function NormalizeICancellableContextRegisterCancellablePromiseOptionsMode(
  mode?: TCancellableContextRegisterCancellablePromiseOptionsMode,
  defaultValue?: TCancellableContextRegisterCancellablePromiseOptionsMode
): TCancellableContextRegisterCancellablePromiseOptionsMode {
  switch (mode) {
    case 'queue':
      return mode;
    default:
      return NormalizeICancellableContextRegisterActivableOptionsMode(mode, defaultValue as TCancellableContextRegisterActivableOptionsMode);
  }
}

export function NormalizeICancellableContextRegisterCancellablePromiseOptions(
  options: ICancellableContextRegisterCancellablePromiseOptions = {},
  defaultValue?: ICancellableContextRegisterCancellablePromiseNormalizedOptions
): ICancellableContextRegisterCancellablePromiseNormalizedOptions {
  if (IsObject(options)) {
    return {
      ...options,
      mode: NormalizeICancellableContextRegisterCancellablePromiseOptionsMode(options.mode, (defaultValue === void 0) ? void 0 : defaultValue.mode),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

/* OTHERS */

export function CancellableContextNormalizeKey(key: string | any[]): any[] {
  return Array.isArray(key) ? key : [key];
}


/**
 * Creates a CancellablePromise from an Activable
 *  - deactivates the Activable if the AdvancedAbortSignal is aborted
 *  - resolves when the Activable is deactivated
 */
export function ActivableToCancellablePromise(activable: IActivableLike, options?: ICancellablePromiseOptions): ICancellablePromise<void> {
  return new CancellablePromise<void>((
    resolve: (value?: TNativePromiseLikeOrValue<void>) => void,
    reject: (reason?: any) => void,
    signal: IAdvancedAbortSignal
  ) => {
    const signalAbortListener = signal.addListener('abort', () => {
      signalAbortListener.deactivate();
      activable.deactivate();
    });
    signalAbortListener.activate();

    resolve(
      PromiseTry(() => activable.activate())
        .then(() => UntilActivableDeactivated(activable, { signal }))
        .then(() => {
          signalAbortListener.deactivate();
        })
    );
  }, options);
}

/**
 * Creates a promise resolved when the Activable is deactivated
 */
export function UntilActivableDeactivated(activable: IActivableLike, options?: ICancellablePromiseOptions): ICancellablePromise<void> {
  return new CancellablePromise<void>((
    resolve: (value?: TNativePromiseLikeOrValue<void>) => void,
    reject: (reason?: any) => void,
    signal: IAdvancedAbortSignal
  ) => {
    if (activable.activated) {
      let stateListener: () => void;
      let timer: any;

      const clear = () => {
        if (stateListener !== void 0) {
          stateListener();
        }
        clearInterval(timer);
        signalAbortListener.deactivate();
      };

      const update = () => {
        if (!activable.activated) {
          clear();
          resolve();
        }
      };

      const signalAbortListener = signal.addListener('abort', () => {
        clear();
      });
      signalAbortListener.activate();

      timer = setInterval(update, 500);

      if (typeof activable.addStateListener === 'function') {
        stateListener = activable.addStateListener(update);
      }
    } else {
      resolve();
    }
  }, options);
}

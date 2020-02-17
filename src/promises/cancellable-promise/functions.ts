import { TAbortStrategy } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import {
  ICancellablePromiseFinallyOptions, ICancellablePromiseNormalizedFinallyOptions, ICancellablePromiseNormalizedOptions,
  ICancellablePromiseOptions
} from './types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IsObject } from '../../helpers';
import { IsAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/constructor';
import { ICancellablePromise } from './interfaces';

/** FUNCTIONS **/

export function CancellablePromiseGetNormalizedOptions<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
): ICancellablePromiseNormalizedOptions<TStrategy> {
  return {
    signal: instance.signal,
    strategy: instance.strategy,
  };
}

/* NORMALIZE: ICancellablePromiseOptions */

export function NormalizeICancellablePromiseOptionsStrategy<TStrategy extends TAbortStrategy>(
  strategy?: TStrategy,
  defaultValue: TAbortStrategy = 'never'
): TStrategy {
  switch (strategy) {
    case void 0:
      return defaultValue as TStrategy;
    case 'resolve':
    case 'reject':
    case 'never':
      return strategy;
    default:
      throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as options.strategy`);
  }
}

export function NormalizeICancellablePromiseOptionsSignal(
  signal?: IAdvancedAbortSignal,
  defaultValue: IAdvancedAbortSignal = new AdvancedAbortController().signal
): IAdvancedAbortSignal {
  if (signal === void 0) {
    return defaultValue;
  } else if (IsAdvancedAbortSignal(signal)) {
    return signal;
  } else {
    throw new TypeError(`Expected AdvancedAbortSignal or void as options.signal`);
  }
}

export function NormalizeICancellablePromiseOptions<TStrategy extends TAbortStrategy>(
  options: ICancellablePromiseOptions<TStrategy> = {},
  defaultValue?: ICancellablePromiseNormalizedOptions<TStrategy>
): ICancellablePromiseNormalizedOptions<TStrategy> {
  if (IsObject(options)) {
    return {
      ...options,
      strategy: NormalizeICancellablePromiseOptionsStrategy<TStrategy>(options.strategy, (defaultValue === void 0) ? void 0 : defaultValue.strategy),
      signal: NormalizeICancellablePromiseOptionsSignal(options.signal, (defaultValue === void 0) ? void 0 : defaultValue.signal),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}


/* NORMALIZE: ICancellablePromiseFinallyOptions */

export function NormalizeICancellablePromiseFinallyOptionsIncludeCancelled(
  includeCancelled?: boolean,
  defaultValue: boolean = true
): boolean {
  if (includeCancelled === void 0) {
    return defaultValue;
  } else if (typeof includeCancelled === 'boolean') {
    return includeCancelled;
  } else {
    throw new TypeError(`Expected AdvancedAbortSignal or void as options.signal`);
  }
}

export function NormalizeICancellablePromiseFinallyOptions(
  options: ICancellablePromiseFinallyOptions = {},
  defaultValue?: ICancellablePromiseNormalizedFinallyOptions
): ICancellablePromiseNormalizedFinallyOptions {
  if (IsObject(options)) {
    return {
      ...options,
      includeCancelled: NormalizeICancellablePromiseFinallyOptionsIncludeCancelled(options.includeCancelled, (defaultValue === void 0) ? void 0 : defaultValue.includeCancelled),
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

import {
  ICancellablePromiseFinallyOptions, ICancellablePromiseNormalizedFinallyOptions, ICancellablePromiseNormalizedOptions,
  ICancellablePromiseOptions
} from './types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IsObject } from '../../helpers';
import { NormalizeAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/helpers';

/** FUNCTIONS **/


/* NORMALIZE: ICancellablePromiseOptions */


export function NormalizeICancellablePromiseOptionsSignal(
  signal?: IAdvancedAbortSignal,
  defaultValue?: IAdvancedAbortSignal
): IAdvancedAbortSignal {
  return NormalizeAdvancedAbortSignal(signal, defaultValue);
}

export function NormalizeICancellablePromiseOptions(
  options: ICancellablePromiseOptions = {},
  defaultValue?: ICancellablePromiseNormalizedOptions
): ICancellablePromiseNormalizedOptions {
  if (IsObject(options)) {
    return {
      ...options,
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

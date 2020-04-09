import { IAdvancedAbortSignal } from './interfaces';
import { AdvancedAbortController } from '../implementation';
import { IsAdvancedAbortSignal } from './constructor';
import { IAdvancedAbortSignalWrapPromiseOptions, TAbortStrategy, TCatchAbortedCallback } from './types';
import { IAdvancedAbortController } from '../interfaces';
import { IsAdvancedAbortController } from '../constructor';
import { IsObject } from '../../../helpers';

export function NormalizeAdvancedAbortSignal(
  signal?: IAdvancedAbortSignal,
  defaultValue: IAdvancedAbortSignal = new AdvancedAbortController().signal
): IAdvancedAbortSignal {
  if (signal === void 0) {
    return defaultValue;
  } else if (IsAdvancedAbortSignal(signal)) {
    return signal;
  } else {
    throw new TypeError(`Expected AdvancedAbortSignal or void as signal`);
  }
}


/**
 * Normalizes options provided to AdvancedAbortSignal.wrapPromise
 */

export function NormalizeAdvancedAbortSignalWrapPromiseOptionsStrategy<TStrategy extends TAbortStrategy>(
  strategy?: TStrategy,
  defaultValue: TAbortStrategy = 'never'
): TStrategy {
  if (strategy === void 0) {
    return defaultValue as TStrategy;
  } else if (['resolve', 'reject', 'never'].includes(strategy)) {
    return strategy;
  } else {
    throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as strategy`);
  }
}

export function NormalizeAdvancedAbortSignalWrapPromiseOptionsOnAborted<TStrategy extends TAbortStrategy, TAborted>(
  onAborted?: TCatchAbortedCallback<TAborted, TStrategy>,
  defaultValue: TCatchAbortedCallback<TAborted, TStrategy> | undefined = void 0
): TCatchAbortedCallback<TAborted, TStrategy> | undefined {
  if (onAborted === void 0) {
    return defaultValue;
  } else if (typeof onAborted === 'function') {
    return onAborted;
  } else {
    throw new TypeError(`Expected function or void as onAborted`);
  }
}

export function NormalizeAdvancedAbortSignalWrapPromiseOptionsOnAbortedController<TStrategy extends TAbortStrategy, TAborted>(
  onAborted?: TCatchAbortedCallback<TAborted, TStrategy>,
  onAbortedController?: IAdvancedAbortController,
  defaultValue: IAdvancedAbortController | undefined = void 0
): IAdvancedAbortController | undefined {
  if (onAbortedController === void 0) {
    return (onAborted === void 0)
      ? void 0
      : (
        IsAdvancedAbortController(defaultValue)
          ? defaultValue
          : new AdvancedAbortController()
      );
  } else if (IsAdvancedAbortController(onAbortedController)) {
    if (onAborted === void 0) {
      throw new Error(`options.onAbortedController is defined but options.onAborted is missing`);
    } else {
      return onAbortedController;
    }
  } else {
    throw new TypeError(`Expected AdvancedAbortController or void as options.onAbortedController`);
  }
}


export interface IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy extends TAbortStrategy, TAborted> extends IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted> {
  strategy: TStrategy;
}

export function NormalizeAdvancedAbortSignalWrapPromiseOptions<TStrategy extends TAbortStrategy, TAborted>(
  options: IAdvancedAbortSignalWrapPromiseOptions<TStrategy, TAborted> = {}
): IAdvancedAbortSignalWrapPromiseNormalizedOptions<TStrategy, TAborted> {
  if (IsObject(options)) {
    const strategy: TStrategy = NormalizeAdvancedAbortSignalWrapPromiseOptionsStrategy<TStrategy>(options.strategy);
    const onAborted: TCatchAbortedCallback<TAborted, TStrategy> | undefined = NormalizeAdvancedAbortSignalWrapPromiseOptionsOnAborted<TStrategy, TAborted>(options.onAborted);
    const onAbortedController: IAdvancedAbortController | undefined = NormalizeAdvancedAbortSignalWrapPromiseOptionsOnAbortedController<TStrategy, TAborted>(onAborted, options.onAbortedController);
    return {
      ...options,
      strategy,
      onAborted,
      onAbortedController
    };
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

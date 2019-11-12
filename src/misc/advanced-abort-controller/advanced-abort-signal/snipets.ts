import { IAdvancedAbortSignal } from './interfaces';

/**
 * EXPERIMENTAL
 */


export function $timeout(callback: () => void, timeout: number, cancelSignal?: IAdvancedAbortSignal): void {
  const stopAbortListener: () => void = (cancelSignal === void 0)
    ? () => {}
    : cancelSignal.whenAborted(() => {
      clearTimeout(timer);
    });
  const timer = setTimeout(() => {
    stopAbortListener();
    callback();
  }, timeout);
}

export function $interval(callback: () => void, timeout: number, cancelSignal: IAdvancedAbortSignal): void {
  const timer = setInterval(callback, timeout);
  cancelSignal.whenAborted(() => {
    clearTimeout(timer);
  });
}

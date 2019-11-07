import { IAdvancedAbortSignal } from './interfaces';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal, IAdvancedAbortSignalPrivate } from './privates';
import { AbortNotification } from '../abort-notification';

/** FUNCTIONS **/

export function AdvancedAbortSignalAbort(instance: IAdvancedAbortSignal, reason: any = void 0): void {
  const privates: IAdvancedAbortSignalPrivate = (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE];
  if (!privates.aborted) {
    privates.aborted = true;
    privates.reason = reason;
    privates.context.emit(new AbortNotification(reason));
  }
}

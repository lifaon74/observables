import { INotificationsObservableContext } from '../../../notifications/core/notifications-observable/context/interfaces';
import { ConstructClassWithPrivateMembers } from '../../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { ADVANCED_ABORT_SIGNAL_PRIVATE, IAdvancedAbortSignalInternal, IAdvancedAbortSignalPrivate } from './privates';
import { IAdvancedAbortSignal, IAdvancedAbortSignalKeyValueMap } from './interfaces';

/** CONSTRUCTOR **/
let ALLOW_ADVANCED_ABORT_SIGNAL_CONSTRUCT: boolean = false;

export function AllowAdvancedAbortSignalConstruct(allow: boolean): void {
  ALLOW_ADVANCED_ABORT_SIGNAL_CONSTRUCT = allow;
}

export function ConstructAdvancedAbortSignal(
  instance: IAdvancedAbortSignal,
  context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>
): void {
  if (ALLOW_ADVANCED_ABORT_SIGNAL_CONSTRUCT) {
    ConstructClassWithPrivateMembers(instance, ADVANCED_ABORT_SIGNAL_PRIVATE);
    const privates: IAdvancedAbortSignalPrivate = (instance as IAdvancedAbortSignalInternal)[ADVANCED_ABORT_SIGNAL_PRIVATE];
    privates.context = context;
    privates.aborted = false;
    privates.reason = void 0;
  } else {
    throw new TypeError(`Illegal constructor`);
  }
}

export function IsAdvancedAbortSignal(value: any): value is IAdvancedAbortSignal {
  return IsObject(value)
    && (value.hasOwnProperty(ADVANCED_ABORT_SIGNAL_PRIVATE as symbol));
}

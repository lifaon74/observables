import { INotificationsObservablePrivatesInternal } from '../../../notifications/core/notifications-observable/privates';
import { IAdvancedAbortSignal, IAdvancedAbortSignalKeyValueMap } from './interfaces';
import { INotificationsObservableContext } from '../../../notifications/core/notifications-observable/context/interfaces';

/** PRIVATES **/

export const ADVANCED_ABORT_SIGNAL_PRIVATE = Symbol('advanced-abort-signal-private');

export interface IAdvancedAbortSignalPrivate {
  context: INotificationsObservableContext<IAdvancedAbortSignalKeyValueMap>;
  aborted: boolean;
  reason: any | undefined;
}

export interface IAdvancedAbortSignalPrivatesInternal extends INotificationsObservablePrivatesInternal<IAdvancedAbortSignalKeyValueMap> {
  [ADVANCED_ABORT_SIGNAL_PRIVATE]: IAdvancedAbortSignalPrivate;
}

export interface IAdvancedAbortSignalInternal extends IAdvancedAbortSignalPrivatesInternal, IAdvancedAbortSignal {
}

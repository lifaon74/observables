import {
  INotificationsObservable, INotificationsObservableConstructor
} from '../../../notifications/core/notifications-observable/interfaces';

/** TYPES **/

export interface IAdvancedAbortSignalKeyValueMap {
  abort: any;
}

/** INSTANCE **/


/* PRIVATE */
export interface IAdvancedAbortSignalConstructor extends Omit<INotificationsObservableConstructor, 'new'> {
  new(): IAdvancedAbortSignal;
}

export interface IAdvancedAbortSignal extends INotificationsObservable<IAdvancedAbortSignalKeyValueMap> {
  readonly aborted: boolean;
  readonly reason: any;

  toAbortController(): AbortController;
}

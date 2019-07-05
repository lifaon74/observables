import { IObserver } from '../../../core/observer/interfaces';
import {
  INotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications,
  TNotificationsObservableConstructorArgs, TNotificationsObservableHook
} from '../../../notifications/core/notifications-observable/interfaces';
import { IActivable, IActivableHook, TActivableConstructorArgs } from '../../../classes/activable/interfaces';
import { IObservable, TObservableConstructorArgs } from '../../../core/observable/interfaces';
import { KeyValueMapConstraint } from '../../../notifications/core/interfaces';

export interface IInputOutputKeyValueMap {
  activate: void;
  deactivate: void;
  error: Error;
}


export type IOKeyValueMapGenericConstraint<TKVMap extends object> = KeyValueMapConstraint<TKVMap, IInputOutputKeyValueMap>;

export type TInputOutputConstructorArgs<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> =
  [TObservable, TObserver];


export interface IInputOutputConstructor {
  new<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>>(
    observable: TObservable,
    observer: TObserver,
  ): IInputOutput<TKVMap, TObservable, TObserver>;
}


export type TInputOutputConstructorArgsSimple<TObservable extends IObservable<any>, TObserver extends IObserver<any>> =
  [TObservable, TObserver];

export interface IInputOutputConstructorSimple {
  new<TObservable extends IObservable<any>, TObserver extends IObserver<any>>(
    observable: TObservable,
    observer: TObserver,
  ): IInputOutput<IInputOutputKeyValueMap, TObservable, TObserver>;
}

export interface IInputOutputSuperClass<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>> extends INotificationsObservable<TKVMap>, IActivable {
}

export interface IInputOutput<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends IInputOutputSuperClass<TKVMap> {
  readonly in: TObservable;
  readonly out: TObserver;
}

/*----------------------------------*/

export interface IInputOutputBaseOptions<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends IActivableHook {
  observable: TObservable;
  observer: TObserver;

  create(context: INotificationsObservableContext<TKVMap>): TNotificationsObservableHook<TKVMap> | void;
}

export interface IInputOutputBaseConstructor {
  new<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>>(
    options: IInputOutputBaseOptions<TKVMap, TObservable, TObserver>
  ): IInputOutput<TKVMap, TObservable, TObserver>;
}

export type TInputOutputBaseOptionsForSuperResult<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> = [
  TInputOutputConstructorArgs<TKVMap, TObservable, TObserver>,
  TActivableConstructorArgs,
  TNotificationsObservableConstructorArgs<TKVMap>,
  TObservableConstructorArgs<KeyValueMapToNotifications<TKVMap>>
];

export type TInputOutputBaseOptionsForSuperResultSimple<TObservable extends IObservable<any>, TObserver extends IObserver<any>> = [
  TInputOutputConstructorArgsSimple<TObservable, TObserver>,
  TActivableConstructorArgs,
  TNotificationsObservableConstructorArgs<IInputOutputKeyValueMap>,
  TObservableConstructorArgs<any>
];


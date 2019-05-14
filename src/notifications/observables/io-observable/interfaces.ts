import { IObserver } from '../../../core/observer/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { IActivable } from '../../../classes/activable/interfaces';
import { IObservable } from '../../../core/observable/interfaces';
import { KeyValueMapConstraint } from '../../core/interfaces';

export interface IInputOutputKeyValueMap {
  activate: undefined;
  deactivate: undefined;
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

export interface IInputOutputSuperClass<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>> extends INotificationsObservable<TKVMap>, IActivable {
}

export interface IInputOutput<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends IInputOutputSuperClass<TKVMap> {
  readonly in: TObservable;
  readonly out: TObserver;
}

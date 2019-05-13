import { IObserver } from '../../../core/observer/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { IActivable } from '../../../classes/activable/interfaces';
import { IObservable } from '../../../core/observable/interfaces';
import { KeyValueMapConstraint } from '../../core/interfaces';

export interface IIOObservableObserverValueMap {
  activate: undefined;
  deactivate: undefined;
  error: Error;
}


export type IOKeyValueMapGenericConstraint<TKVMap extends object> = KeyValueMapConstraint<TKVMap, IIOObservableObserverValueMap>;

export type TIOObservableObserverConstructorArgs = [];

export interface IIOObservableObserverConstructor {
  new<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>>(): IIOObservableObserver<TKVMap, TObservable, TObserver>;
}

export interface IIOObservableObserver<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends INotificationsObservable<TKVMap>, IActivable {
  readonly in: TObservable;
  readonly out: TObserver;
}

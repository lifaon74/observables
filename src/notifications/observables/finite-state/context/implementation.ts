import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableModeConstraint
} from '../types';
import { IFiniteStateObservable } from '../interfaces';
import { IFiniteStateObservableContext, IFiniteStateObservableContextConstructor } from './interfaces';
import { AllowObservableContextBaseConstruct } from '../../../../core/observable/context/base/constructor';
import { NotificationsObservableContext } from '../../../core/notifications-observable/context/implementation';
import {
  KeyValueMapToNotifications, KeyValueMapToNotificationsGeneric
} from '../../../core/notifications-observable/types';
import { KeyValueMapKeys, KeyValueMapValues } from '../../../core/interfaces';
import { Notification } from '../../../core/notification/implementation';
import { FiniteStateObservableClearCache, FiniteStateObservableOnEmit } from '../functions';

/** NEW **/

export function NewFiniteStateObservableContext<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> {
  AllowObservableContextBaseConstruct(true);
  const context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> = new ((FiniteStateObservableContext as any) as IFiniteStateObservableContextConstructor)<TValue, TFinalState, TMode, TKVMap>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

/** CLASS **/

/* PRIVATE */
export class FiniteStateObservableContext<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends NotificationsObservableContext<TKVMap> implements IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap> {

  protected constructor(observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>) {
    super(observable);
  }

  get observable(): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> {
    // @ts-ignore
    return super.observable as IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
  }

  emit(value: KeyValueMapToNotifications<TKVMap>): void {
    FiniteStateObservableOnEmit<TValue, TFinalState, TMode, TKVMap>(this.observable, value);
    super.emit(value);
  }

  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value: TKVMap[K]): void {
    this.emit(new Notification<K, TKVMap[K]>(name, value) as KeyValueMapToNotificationsGeneric<TKVMap> as KeyValueMapToNotifications<TKVMap>);
  }

  next(value: TValue): void {
    this.dispatch('next' as KeyValueMapKeys<TKVMap>, value as KeyValueMapValues<TKVMap>);
  }

  complete(): void {
    this.dispatch('complete' as KeyValueMapKeys<TKVMap>, void 0 as KeyValueMapValues<TKVMap>);
  }

  error(error?: any): void {
    this.dispatch('error' as KeyValueMapKeys<TKVMap>, error as KeyValueMapValues<TKVMap>);
  }

  clearCache(): void {
    FiniteStateObservableClearCache<TValue, TFinalState, TMode, TKVMap>(this.observable);
  }
}

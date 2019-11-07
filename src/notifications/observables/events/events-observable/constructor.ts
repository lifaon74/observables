import { EventKeyValueMapConstraint, IEventsObservable } from './interfaces';
import { IEventsListener } from '../events-listener/interfaces';
import { KeyValueMapKeys, KeyValueMapValues } from '../../../core/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { EVENTS_OBSERVABLE_PRIVATE, IEventsObservableInternal, IEventsObservablePrivate } from './privates';
import { IObserver } from '../../../../core/observer/interfaces';
import { KeyValueMapToNotifications } from '../../../core/notifications-observable/types';
import { IsObject } from '../../../../helpers';

/** CONSTRUCTOR **/

export function ConstructEventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends IEventsListener>(
  instance: IEventsObservable<TKVMap, TTarget>,
  target: TTarget,
  name: KeyValueMapKeys<TKVMap> | null
): void {
  ConstructClassWithPrivateMembers(instance, EVENTS_OBSERVABLE_PRIVATE);
  const privates: IEventsObservablePrivate<TKVMap, TTarget> = (instance as IEventsObservableInternal<TKVMap, TTarget>)[EVENTS_OBSERVABLE_PRIVATE];
  privates.target = target;
  privates.name = name;
  privates.observerListenerMap = new WeakMap<IObserver<KeyValueMapToNotifications<TKVMap>>, (event: KeyValueMapValues<TKVMap>) => void>();
}

export function IsEventsObservable(value: any): value is IEventsObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(EVENTS_OBSERVABLE_PRIVATE as symbol);
}

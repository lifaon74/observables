import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import { ICompleteStateObservable, ICompleteStateObservableTypedConstructor } from '../../interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import {
  FromRXJSObservableKeyValueMap, IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableOptions,
  TFromRXJSObservableConstructorArgs, TFromRXJSObservableNotifications
} from './interfaces';
import { IsObject } from '../../../../../helpers';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../../../classes/factory';
import { CompleteStateObservableFactory, IsCompleteStateObservableConstructor } from '../../implementation';
import { INotificationsObservableTypedConstructor } from '../../../../core/notifications-observable/interfaces';
import { IObservableConstructor } from '../../../../../core/observable/interfaces';
import { NotificationsObservableFactory } from '../../../../core/notifications-observable/implementation';
import { ObservableFactory } from '../../../../../core/observable/implementation';
import { clearImmediate, setImmediate } from '../../../../../classes/set-immediate';
import { BuildCompleteStateObservableHookBasedOnSharedFactoryFunction } from '../../factory';
import { Notification } from '../../../../core/notification/implementation';


export const FROM_RXJS_OBSERVABLE_PRIVATE = Symbol('from-rxjs-observable-private');

export interface IFromRXJSObservablePrivate<T> {
  rxObservable: RXObservable<T>;
}

export interface IFromRXJSObservableInternal<T> extends IFromRXJSObservable<T> {
  [FROM_RXJS_OBSERVABLE_PRIVATE]: IFromRXJSObservablePrivate<T>;
}

export function ConstructFromRXJSObservable<T>(
  instance: IFromRXJSObservable<T>,
  rxObservable: RXObservable<T>
): void {
  ConstructClassWithPrivateMembers(instance, FROM_RXJS_OBSERVABLE_PRIVATE);
  (instance as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxObservable = rxObservable;
}

export function IsFromRXJSObservable(value: any): value is IFromRXJSObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_RXJS_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-rxjs-observable-constructor');

export function IsFromRXJSObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR);
}


/**
 * Ensures a proper destruction (unsubscribe) of the RXJS's Subscription
 * @param rxSubscriptionCallback
 * @param count
 */
function FromRXJSObservableUnsubscribe<T>(rxSubscriptionCallback: () => (RXSubscription | undefined), count: number = 1): void {
  if (count >= 0) {
    const rxSubscription: RXSubscription | undefined = rxSubscriptionCallback();
    if (rxSubscription === void 0) { // may append if rxObservable is complete before rxSubscription is set
      // in this case, delay the executing until rxSubscription exists
      setImmediate(() => {
        FromRXJSObservableUnsubscribe<T>(rxSubscriptionCallback, count - 1);
      });
    } else {
      rxSubscription.unsubscribe();
    }
  }
}

function FromRXJSObservableHookBasedOnSharedFactoryFunction<T>(emit: (value: TFromRXJSObservableNotifications<T>) => void): () => void {
  const instance: IFromRXJSObservable<T> = this;
  let rxSubscription: RXSubscription | undefined;
  const timer = setImmediate(() => {
    rxSubscription = (instance as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxObservable
      .subscribe(
        (value: T) => {
          emit(new Notification<'next', T>('next', value));
        },
        (error: any) => {
          FromRXJSObservableUnsubscribe<T>(() => rxSubscription);
          emit(new Notification<'error', any>('error', error));
        },
        () => {
          FromRXJSObservableUnsubscribe<T>(() => rxSubscription);
          emit(new Notification<'complete', void>('complete', void 0));
        });
  });
  return () => {
    clearImmediate(timer);
    FromRXJSObservableUnsubscribe<T>(() => rxSubscription);
  };
}


export function PureFromRXJSObservableFactory<TBase extends Constructor<ICompleteStateObservable<any, FromRXJSObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsCompleteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected CompleteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromRXJSObservable extends superClass implements IFromRXJSObservable<T> {
    constructor(...args: any[]) {
      const [rxObservable, options]: TFromRXJSObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        BuildCompleteStateObservableHookBasedOnSharedFactoryFunction<T, FromRXJSObservableKeyValueMap<T>>(FromRXJSObservableHookBasedOnSharedFactoryFunction),
        options
      ]));
      ConstructFromRXJSObservable<T>(this, rxObservable);
    }
  };
}

export let FromRXJSObservable: IFromRXJSObservableConstructor;

export function FromRXJSObservableFactory<TBase extends Constructor<ICompleteStateObservable<any, FromRXJSObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [], TBase>(PureFromRXJSObservableFactory, [], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromRXJSObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [
    ICompleteStateObservableTypedConstructor<any, FromRXJSObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<FromRXJSObservableKeyValueMap<any>>,
    IObservableConstructor
    ], TBase>(PureFromRXJSObservableFactory, [CompleteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_RXJS_OBSERVABLE_CONSTRUCTOR],
  });
}

FromRXJSObservable = class FromRXJSObservable extends FromRXJSObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(rxObservable: RXObservable<any>, options?: IFromRXJSObservableOptions) {
    super([rxObservable, options], [], [], []);
  }
} as IFromRXJSObservableConstructor;

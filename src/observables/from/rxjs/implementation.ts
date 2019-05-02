import {
  IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableNotificationKeyValueMap,
  INotificationsFromObservable,
  TFromRXJSObservableConstructorArgs, TFromRXJSObservableNotifications
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import {
  IFromObservable, IFromObservableContext, TFromObservableCompleteAction
} from '../interfaces';
import { ObservableClearObservers, ObservableFactory } from '../../../core/observable/implementation';
import {
  FROM_OBSERVABLE_PRIVATE, FromObservableFactory, IFromObservableInternal, IFromObservablePrivate,
  IsFromObservableConstructor
} from '../implementation';
import {
  Constructor, FactoryClass, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass
} from '../../../classes/factory';
import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import {
  NotificationsObservableFactory
} from '../../../notifications/core/notifications-observable/implementation';
import {
  Notification
} from '../../../notifications/core/notification/implementation';
import { KeyValueMapToNotifications } from '../../../notifications/core/notifications-observable/interfaces';
import { IRXJSObservableNotificationKeyValueMap } from '../../../operators/fromRXJSObservable';


export const FROM_RXJS_OBSERVABLE_PRIVATE = Symbol('from-rxjs-observable-private');

export interface IFromRXJSObservablePrivate<TValue, TError> {
  context: IFromObservableContext<TFromRXJSObservableNotifications<TValue, TError>>;
  rxObservable: RXObservable<TValue>;
  rxSubscription: RXSubscription | null;
}

export interface IFromRXJSObservableInternal<TValue, TError> extends IFromRXJSObservable<TValue, TError> {
  [FROM_RXJS_OBSERVABLE_PRIVATE]: IFromRXJSObservablePrivate<TValue, TError>;
  [FROM_OBSERVABLE_PRIVATE]: IFromObservablePrivate<TFromRXJSObservableNotifications<TValue, TError>>;
}

export function ConstructFromRXJSObservable<TValue, TError>(
  observable: IFromRXJSObservable<TValue, TError>,
  context: IFromObservableContext<TFromRXJSObservableNotifications<TValue, TError>>,
  rxObservable: RXObservable<TValue>
): void {
  ConstructClassWithPrivateMembers(observable, FROM_RXJS_OBSERVABLE_PRIVATE);
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].context = context;
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxObservable = rxObservable;
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxSubscription = null;
}

export function IsFromRXJSObservable(value: any): value is IFromRXJSObservable<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_RXJS_OBSERVABLE_PRIVATE);
}

const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-rxjs-observable-constructor');
export function IsFromRXJSObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}


export function FromRXJSObservableOnObserved<TValue, TError>(observable: IFromRXJSObservable<TValue, TError>): void {
  if ((observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_OBSERVABLE_PRIVATE].state === 'awaiting') {
    (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_OBSERVABLE_PRIVATE].state = 'emitting';

    const privates: IFromRXJSObservablePrivate<TValue, TError> = (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE];

    const onComplete = () => {
      if (privates.rxSubscription === null) { // still initializing
        setTimeout(onComplete, 0);
      } else {
        privates.context.emit(new Notification<'complete', void>('complete'));
        privates.context.complete();
      }
    };

    privates.rxSubscription = privates.rxObservable
      .subscribe(
      (value: TValue) => {
        privates.context.emit(new Notification<'next', TValue>('next', value));
      },
      (error: TError) => {
        privates.context.emit(new Notification<'error', TError>('error', error));
      }, onComplete);
  }
}

export function FromRXJSObservableOnUnobserved<TValue, TError>(observable: IFromRXJSObservable<TValue, TError>): void {
  if ((observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_OBSERVABLE_PRIVATE].state === 'emitting') {
    if (!(observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].context.observable.observed) {
      (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxSubscription.unsubscribe();
      (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxSubscription = null;
    }
  }
}


export function FromRXJSObservableFactory<TBase extends Constructor<INotificationsFromObservable<any, any>>>(superClass: TBase) {
  type TValue = any;
  type TError = any;
  type TNotifications = TFromRXJSObservableNotifications<TValue, TError>;

  if (!IsFromObservableConstructor(superClass)) {
    throw new TypeError(`Expected FromObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return FactoryClass(class FromRXJSObservable extends superClass implements IFromRXJSObservable<TValue, TError> {
    constructor(...args: any[]) {
      const [rxObservable, onComplete]: TFromRXJSObservableConstructorArgs<TValue, TError> = args[0];
      let context: IFromObservableContext<TNotifications> = void 0;
      super(...setSuperArgs(args.slice(1), [
        (_context: IFromObservableContext<TNotifications>) => {
          context = _context;
          return {
            onObserved(): void {
              FromRXJSObservableOnObserved<TValue, TError>(this);
            },
            onUnobserved(): void {
              FromRXJSObservableOnUnobserved<TValue, TError>(this);
            }
          };
        }, onComplete
      ]));
      ConstructFromRXJSObservable<TValue, TError>(this, context, rxObservable);
    }
  })<TFromRXJSObservableConstructorArgs<TValue, TError>>('FromRXJSObservable', [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR]);
}

export const FromRXJSObservable: IFromRXJSObservableConstructor = class FromRXJSObservable extends FromRXJSObservableFactory(FromObservableFactory(NotificationsObservableFactory(ObservableFactory<ObjectConstructor>(Object))) as any) {
  constructor(rxObservable: RXObservable<any>, onComplete?: TFromObservableCompleteAction) {
    super([rxObservable, onComplete], [], [], []);
  }
} as any;

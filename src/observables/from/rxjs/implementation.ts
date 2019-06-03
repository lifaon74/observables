import {
  IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableNotificationKeyValueMap,
  INotificationsFromObservable, TFromRXJSObservableConstructorArgs, TFromRXJSObservableNotifications
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { IFromObservableConstructor, IFromObservableContext, TFromObservableCompleteAction } from '../interfaces';
import { ObservableFactory } from '../../../core/observable/implementation';
import { FromObservableFactory, IsFromObservableConstructor } from '../implementation';
import {
  Constructor, GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/factory';
import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import { NotificationsObservableFactory } from '../../../notifications/core/notifications-observable/implementation';
import { Notification } from '../../../notifications/core/notification/implementation';
import { INotificationsObservableTypedConstructor } from '../../../notifications/core/notifications-observable/interfaces';
import { IObservableConstructor } from '../../../core/observable/interfaces';


export const FROM_RXJS_OBSERVABLE_PRIVATE = Symbol('from-rxjs-observable-private');

export interface IFromRXJSObservablePrivate<TValue, TError> {
  context: IFromObservableContext<TFromRXJSObservableNotifications<TValue, TError>>;
  pending: boolean;
  rxObservable: RXObservable<TValue>;
  rxSubscription: RXSubscription | null;
}

export interface IFromRXJSObservableInternal<TValue, TError> extends IFromRXJSObservable<TValue, TError> {
  [FROM_RXJS_OBSERVABLE_PRIVATE]: IFromRXJSObservablePrivate<TValue, TError>;
}

export function ConstructFromRXJSObservable<TValue, TError>(
  observable: IFromRXJSObservable<TValue, TError>,
  context: IFromObservableContext<TFromRXJSObservableNotifications<TValue, TError>>,
  rxObservable: RXObservable<TValue>
): void {
  ConstructClassWithPrivateMembers(observable, FROM_RXJS_OBSERVABLE_PRIVATE);
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].context = context;
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].pending = true;
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxObservable = rxObservable;
  (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].rxSubscription = null;
}

export function IsFromRXJSObservable(value: any): value is IFromRXJSObservable<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(FROM_RXJS_OBSERVABLE_PRIVATE as symbol);
}

const IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR = Symbol('is-from-rxjs-observable-constructor');

export function IsFromRXJSObservableConstructor(value: any): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR);
}


export function FromRXJSObservableOnObserved<TValue, TError>(observable: IFromRXJSObservable<TValue, TError>): void {
  if ((observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].pending) {
    (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].pending = false;

    const privates: IFromRXJSObservablePrivate<TValue, TError> = (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE];

    privates.rxSubscription = privates.rxObservable
      .subscribe(
        (value: TValue) => {
          privates.context.emit(new Notification<'next', TValue>('next', value));
        },
        (error: TError) => {
          privates.context.emit(new Notification<'error', TError>('error', error));
        },
        () => {
          privates.context.emit(new Notification<'complete', undefined>('complete', void 0));
          privates.context.complete();
        });
  }
}

export function FromRXJSObservableOnUnobserved<TValue, TError>(observable: IFromRXJSObservable<TValue, TError>): void {
  if (!(observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].pending) {
    if (!(observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE].context.observable.observed) {
      FromRXJSObservableUnsubscribe<TValue, TError>(observable);
    }
  }
}

export function FromRXJSObservableUnsubscribe<TValue, TError>(observable: IFromRXJSObservable<TValue, TError>, count: number = 1): void {
  const privates: IFromRXJSObservablePrivate<TValue, TError> = (observable as IFromRXJSObservableInternal<TValue, TError>)[FROM_RXJS_OBSERVABLE_PRIVATE];

  if (count >= 0) {
    if (privates.rxSubscription === null) { // may append if rxObservable is complete before rxSubscription is set
      // in this case, delay the executing until rxSubscription exists
      setTimeout(() => {
        FromRXJSObservableUnsubscribe<TValue, TError>(observable, count - 1);
      }, 0);
    } else {
      privates.rxSubscription.unsubscribe();
      privates.rxSubscription = null;
    }
  }
}


export function PureFromRXJSObservableFactory<TBase extends Constructor<INotificationsFromObservable<any, any>>>(superClass: TBase) {
  type TValue = any;
  type TError = any;
  type TNotifications = TFromRXJSObservableNotifications<TValue, TError>;

  if (!IsFromObservableConstructor(superClass)) {
    throw new TypeError(`Expected FromObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromRXJSObservable extends superClass implements IFromRXJSObservable<TValue, TError> {
    constructor(...args: any[]) {
      const [rxObservable, onComplete]: TFromRXJSObservableConstructorArgs<TValue, TError> = args[0];
      let context: IFromObservableContext<TNotifications>;
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
      // @ts-ignore
      ConstructFromRXJSObservable<TValue, TError>(this, context, rxObservable);
    }
  };
}

export let FromRXJSObservable: IFromRXJSObservableConstructor;

export function FromRXJSObservableFactory<TBase extends Constructor<INotificationsFromObservable<any, any>>>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [], TBase>(PureFromRXJSObservableFactory, [], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromRXJSObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromRXJSObservableConstructor, [IFromObservableConstructor, INotificationsObservableTypedConstructor<IFromRXJSObservableNotificationKeyValueMap<any, any>>, IObservableConstructor], TBase>(PureFromRXJSObservableFactory, [FromObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromRXJSObservable',
    instanceOf: FromRXJSObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

FromRXJSObservable = class FromRXJSObservable extends FromRXJSObservableBaseFactory<ObjectConstructor>(Object) {
  constructor(rxObservable: RXObservable<any>, onComplete?: TFromObservableCompleteAction) {
    super([rxObservable, onComplete], [], [], []);
  }
} as IFromRXJSObservableConstructor;

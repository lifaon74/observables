import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import {
  ICompleteStateObservable, ICompleteStateObservableContext, ICompleteStateObservableTypedConstructor
} from '../../interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import {
  FromRXJSObservableKeyValueMap, IFromRXJSObservable, IFromRXJSObservableConstructor, IFromRXJSObservableOptions,
  TFromRXJSObservableConstructorArgs
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
import { setImmediate } from '../../../../../classes/set-immediate';


export const FROM_RXJS_OBSERVABLE_PRIVATE = Symbol('from-rxjs-observable-private');

export interface IFromRXJSObservablePrivate<T> {
  context: ICompleteStateObservableContext<T, FromRXJSObservableKeyValueMap<T>>;
  rxObservable: RXObservable<T>;
  rxSubscription: RXSubscription | null;
}

export interface IFromRXJSObservableInternal<T> extends IFromRXJSObservable<T> {
  [FROM_RXJS_OBSERVABLE_PRIVATE]: IFromRXJSObservablePrivate<T>;
}

export function ConstructFromRXJSObservable<T>(
  instance: IFromRXJSObservable<T>,
  context: ICompleteStateObservableContext<T, FromRXJSObservableKeyValueMap<T>>,
  rxObservable: RXObservable<T>
): void {
  ConstructClassWithPrivateMembers(instance, FROM_RXJS_OBSERVABLE_PRIVATE);
  const privates: IFromRXJSObservablePrivate<T> = (instance as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.rxObservable = rxObservable;
  privates.rxSubscription = null;
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
 * Properly clear resources when Observable is complete or it has no more Observers
 * @param instance
 * @param done
 */
function FromRXJSObservableClear<T>(instance: IFromRXJSObservable<T>, done: boolean): void {
  const privates: IFromRXJSObservablePrivate<T> = (instance as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE];
  FromRXJSObservableUnsubscribe<T>(instance);
  if (!done) {
    privates.context.clearCache();
  }
}

/**
 * Ensures a proper destruction (unsubscribe) of the RXJS's Subscription
 * @param observable
 * @param count
 */
function FromRXJSObservableUnsubscribe<T>(observable: IFromRXJSObservable<T>, count: number = 1): void {
  const privates: IFromRXJSObservablePrivate<T> = (observable as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE];
  if (count >= 0) {
    if (privates.rxSubscription === null) { // may append if rxObservable is complete before rxSubscription is set
      // in this case, delay the executing until rxSubscription exists
      setImmediate(() => {
        FromRXJSObservableUnsubscribe<T>(observable, count - 1);
      });
    } else {
      privates.rxSubscription.unsubscribe();
      privates.rxSubscription = null;
    }
  }
}


export function FromRXJSObservableOnObserved<T>(instance: IFromRXJSObservable<T>): void {
  const privates: IFromRXJSObservablePrivate<T> = (instance as IFromRXJSObservableInternal<T>)[FROM_RXJS_OBSERVABLE_PRIVATE];
  if (
    (instance.observers.length === 1)
    && (instance.state === 'emitting')
  ) {
    privates.rxSubscription = privates.rxObservable
      .subscribe(
        (value: T) => {
          privates.context.next(value);
        },
        (error: any) => {
          FromRXJSObservableClear<T>(instance, true);
          privates.context.error(error);
        },
        () => {
          FromRXJSObservableClear<T>(instance, true);
          privates.context.complete();
        });
  }
}

export function FromRXJSObservableOnUnobserved<T>(instance: IFromRXJSObservable<T>): void {
  if (!instance.observed) {
    FromRXJSObservableClear<T>(instance, instance.state !== 'emitting');
  }
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
      let context: ICompleteStateObservableContext<T, FromRXJSObservableKeyValueMap<T>>;
      super(...setSuperArgs(args.slice(1), [
        (_context: ICompleteStateObservableContext<T, FromRXJSObservableKeyValueMap<T>>) => {
          context = _context;
          return {
            onObserved(): void {
              FromRXJSObservableOnObserved<T>(this);
            },
            onUnobserved(): void {
              FromRXJSObservableOnUnobserved<T>(this);
            }
          };
        }, options
      ]));
      // @ts-ignore
      ConstructFromRXJSObservable<T>(this, context, rxObservable);
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

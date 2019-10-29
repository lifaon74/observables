import { IObservableConstructor} from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  IAsyncValueObservable, IAsyncValueObservableConstructor, IAsyncValueObservableContext,
  IAsyncValueObservableContextConstructor, TAsyncValueObservableConstructorArgs
} from './interfaces';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/class-helpers/factory';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';
import { IValueObservable, IValueObservableConstructor, IValueObservableContext } from '../value-observable/interfaces';
import {
  IsValueObservableConstructor, IValueObservableInternal, ValueObservableFactory,
} from '../value-observable/implementation';
import {
  CancelReason, CancelToken
} from '../../../misc/cancel-token/implementation';
import { IsObject } from '../../../helpers';
import { Constructor } from '../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../classes/class-helpers/base-class';
import { IS_OBSERVABLE_LIKE_CONSTRUCTOR } from '../../../core/observable/constructor';
import { ObservableFactory } from '../../../core/observable/implementation';
import { IObservableHook } from '../../../core/observable/hook/interfaces';
import {
  IObservableContextBaseInternal, OBSERVABLE_CONTEXT_BASE_PRIVATE
} from '../../../core/observable/context/base/privates';
import { AllowObservableContextBaseConstruct } from '../../../core/observable/context/base/constructor';
import { ObservableContextBase } from '../../../core/observable/context/base/implementation';
import { IObservableHookPrivate } from '../../../core/observable/hook/privates';
import { InitObservableHook } from '../../../core/observable/hook/init';


export const ASYNC_VALUE_OBSERVABLE_PRIVATE = Symbol('async-value-observable-private');

export interface IAsyncValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IValueObservableContext<T>;
  promise: Promise<T> | null;
  token: ICancelToken | null;
}

export interface IAsyncValueObservableInternal<T> extends IAsyncValueObservable<T>, IValueObservableInternal<T> {
  [ASYNC_VALUE_OBSERVABLE_PRIVATE]: IAsyncValueObservablePrivate<T>;
}


export function ConstructAsyncValueObservable<T>(
  observable: IAsyncValueObservable<T>,
  context: IValueObservableContext<T>,
  create?: (context: IAsyncValueObservableContext<T>) => (IObservableHook<T> | void)
): void {
  ConstructClassWithPrivateMembers(observable, ASYNC_VALUE_OBSERVABLE_PRIVATE);

  (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].context = context;
  (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].promise = null;
  (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].token = null;

  InitObservableHook(
    observable,
    (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE],
    NewAsyncValueObservableContext,
    create,
  );
}

export function IsAsyncValueObservable(value: any): value is IAsyncValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_VALUE_OBSERVABLE_PRIVATE);
}

const IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-async-value-observable-constructor');

export function IsAsyncValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === AsyncValueObservable) || HasFactoryWaterMark(value, IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR));
}


export function AsyncValueObservableOnObserved<T>(observable: IAsyncValueObservable<T>, observer: IObserver<T>): void {
  (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function AsyncValueObservableOnUnobserved<T>(observable: IAsyncValueObservable<T>, observer: IObserver<T>): void {
  (observable as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

/**
 * TODO maybe emits should be chained (awaiting for previous emit) instead of cancelled
 * => Nope because previous promise may never resolve !
 *  => May use a "mode" to specify behaviour
 */
export function AsyncValueObservableEmit<T>(observable: IAsyncValueObservable<T>, promise: Promise<T>, token: ICancelToken = new CancelToken()): Promise<void> {
  const privates: IAsyncValueObservablePrivate<T> = ((observable as unknown) as IAsyncValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE];

  if (privates.token !== null) {
    privates.token.cancel(new CancelReason('Emit before last one finished'));
  }
  privates.token = token;
  privates.promise = promise;

  return token.wrapPromise<T, 'never', never>(privates.promise)
    .then((value: T) => {
      privates.context.emit(value);
    });
}

function PureAsyncValueObservableFactory<TBase extends Constructor<IValueObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsValueObservableConstructor(superClass)) {
    throw new TypeError(`Expected ValueObservables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class AsyncValueObservable extends superClass implements IAsyncValueObservable<T> {
    constructor(...args: any[]) {
      const [create]: TAsyncValueObservableConstructorArgs<T> = args[0];
      let context: IValueObservableContext<T>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IValueObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              AsyncValueObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              AsyncValueObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      // @ts-ignore
      ConstructAsyncValueObservable<T>(this, context, create);
    }
  };
}

export let AsyncValueObservable: IAsyncValueObservableConstructor;

export function AsyncValueObservableFactory<TBase extends Constructor<IValueObservable<any>>>(superClass: TBase) {
  return MakeFactory<IAsyncValueObservableConstructor, [], TBase>(PureAsyncValueObservableFactory, [], superClass, {
    name: 'AsyncValueObservable',
    instanceOf: AsyncValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function AsyncValueObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IAsyncValueObservableConstructor, [IValueObservableConstructor, IObservableConstructor], TBase>(PureAsyncValueObservableFactory, [ValueObservableFactory, ObservableFactory], superClass, {
    name: 'AsyncValueObservable',
    instanceOf: AsyncValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

AsyncValueObservable = class AsyncValueObservable extends AsyncValueObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: IAsyncValueObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create], [], []);
  }
} as IAsyncValueObservableConstructor;


/*--------------------------*/

export function NewAsyncValueObservableContext<T>(observable: IAsyncValueObservable<T>): IAsyncValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IAsyncValueObservableContext<T> = new ((AsyncValueObservableContext as any) as IAsyncValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function AsyncValueObservableContextEmit<T>(context: IAsyncValueObservableContext<T>, promise: Promise<T>, token?: ICancelToken): Promise<void> {
  return AsyncValueObservableEmit<T>(context.observable, promise, token);
}


export class AsyncValueObservableContext<T> extends ObservableContextBase<T> implements IAsyncValueObservableContext<T> {
  protected constructor(observable: IAsyncValueObservable<T>) {
    super(observable);
  }

  get observable(): IAsyncValueObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as IAsyncValueObservable<T>;
  }

  emit(promise: Promise<T>, token?: ICancelToken): Promise<void> {
    return AsyncValueObservableContextEmit<T>(this, promise, token);
  }

}







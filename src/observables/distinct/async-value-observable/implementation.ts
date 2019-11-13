import { IObservableConstructor} from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  IAsyncDistinctValueObservable, IAsyncDistinctValueObservableConstructor, IAsyncDistinctValueObservableContext,
  IAsyncDistinctValueObservableContextConstructor, TAsyncDistinctValueObservableConstructorArgs
} from './interfaces';
import {
  GetSetSuperArgsFunction, HasFactoryWaterMark, IsFactoryClass, MakeFactory
} from '../../../classes/class-helpers/factory';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';
import { IDistinctValueObservable, IDistinctValueObservableConstructor, IDistinctValueObservableContext } from '../distinct-value-observable/interfaces';
import {
  IsDistinctValueObservableConstructor, IDistinctValueObservableInternal, DistinctValueObservableFactory,
} from '../distinct-value-observable/implementation';
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

export interface IAsyncDistinctValueObservablePrivate<T> extends IObservableHookPrivate<T> {
  context: IDistinctValueObservableContext<T>;
  promise: Promise<T> | null;
  token: ICancelToken | null;
}

export interface IAsyncDistinctValueObservableInternal<T> extends IAsyncDistinctValueObservable<T>, IDistinctValueObservableInternal<T> {
  [ASYNC_VALUE_OBSERVABLE_PRIVATE]: IAsyncDistinctValueObservablePrivate<T>;
}


export function ConstructAsyncDistinctValueObservable<T>(
  observable: IAsyncDistinctValueObservable<T>,
  context: IDistinctValueObservableContext<T>,
  create?: (context: IAsyncDistinctValueObservableContext<T>) => (IObservableHook<T> | void)
): void {
  ConstructClassWithPrivateMembers(observable, ASYNC_VALUE_OBSERVABLE_PRIVATE);

  (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].context = context;
  (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].promise = null;
  (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].token = null;

  InitObservableHook(
    observable,
    (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE],
    NewAsyncDistinctValueObservableContext,
    create,
  );
}

export function IsAsyncDistinctValueObservable(value: any): value is IAsyncDistinctValueObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_VALUE_OBSERVABLE_PRIVATE);
}

const IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR = Symbol('is-async-value-observable-constructor');

export function IsAsyncDistinctValueObservableConstructor(value: any): boolean {
  return (typeof value === 'function') && ((value === AsyncDistinctValueObservable) || HasFactoryWaterMark(value, IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR));
}


export function AsyncDistinctValueObservableOnObserved<T>(observable: IAsyncDistinctValueObservable<T>, observer: IObserver<T>): void {
  (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].onObserveHook(observer);
}

export function AsyncDistinctValueObservableOnUnobserved<T>(observable: IAsyncDistinctValueObservable<T>, observer: IObserver<T>): void {
  (observable as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].onUnobserveHook(observer);
}

/**
 * TODO maybe emits should be chained (awaiting for previous emit) instead of cancelled
 * => Nope because previous promise may never resolve !
 *  => May use a "mode" to specify behaviour
 */
export function AsyncDistinctValueObservableEmit<T>(observable: IAsyncDistinctValueObservable<T>, promise: Promise<T>, token: ICancelToken = new CancelToken()): Promise<void> {
  const privates: IAsyncDistinctValueObservablePrivate<T> = ((observable as unknown) as IAsyncDistinctValueObservableInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE];

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

function PureAsyncDistinctValueObservableFactory<TBase extends Constructor<IDistinctValueObservable<any>>>(superClass: TBase) {
  type T = any;
  if (!IsDistinctValueObservableConstructor(superClass)) {
    throw new TypeError(`Expected DistinctValueObservables' constructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class AsyncDistinctValueObservable extends superClass implements IAsyncDistinctValueObservable<T> {
    constructor(...args: any[]) {
      const [create]: TAsyncDistinctValueObservableConstructorArgs<T> = args[0];
      let context: IDistinctValueObservableContext<T>;
      super(...setSuperArgs(args.slice(1), [
        (_context: IDistinctValueObservableContext<T>) => {
          context = _context;
          return {
            onObserved: (observer: IObserver<T>): void => {
              AsyncDistinctValueObservableOnObserved(this, observer);
            },
            onUnobserved: (observer: IObserver<T>): void => {
              AsyncDistinctValueObservableOnUnobserved(this, observer);
            }
          };
        }
      ]));
      // @ts-ignore
      ConstructAsyncDistinctValueObservable<T>(this, context, create);
    }
  };
}

export let AsyncDistinctValueObservable: IAsyncDistinctValueObservableConstructor;

export function AsyncDistinctValueObservableFactory<TBase extends Constructor<IDistinctValueObservable<any>>>(superClass: TBase) {
  return MakeFactory<IAsyncDistinctValueObservableConstructor, [], TBase>(PureAsyncDistinctValueObservableFactory, [], superClass, {
    name: 'AsyncDistinctValueObservable',
    instanceOf: AsyncDistinctValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

export function AsyncDistinctValueObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IAsyncDistinctValueObservableConstructor, [IDistinctValueObservableConstructor, IObservableConstructor], TBase>(PureAsyncDistinctValueObservableFactory, [DistinctValueObservableFactory, ObservableFactory], superClass, {
    name: 'AsyncDistinctValueObservable',
    instanceOf: AsyncDistinctValueObservable,
    waterMarks: [IS_ASYNC_VALUE_OBSERVABLE_CONSTRUCTOR, IS_OBSERVABLE_LIKE_CONSTRUCTOR],
  });
}

AsyncDistinctValueObservable = class AsyncDistinctValueObservable extends AsyncDistinctValueObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(create?: (context: IAsyncDistinctValueObservableContext<any>) => (IObservableHook<any> | void)) {
    super([create], [], []);
  }
} as IAsyncDistinctValueObservableConstructor;


/*--------------------------*/

export function NewAsyncDistinctValueObservableContext<T>(observable: IAsyncDistinctValueObservable<T>): IAsyncDistinctValueObservableContext<T> {
  AllowObservableContextBaseConstruct(true);
  const context: IAsyncDistinctValueObservableContext<T> = new ((AsyncDistinctValueObservableContext as any) as IAsyncDistinctValueObservableContextConstructor)<T>(observable);
  AllowObservableContextBaseConstruct(false);
  return context;
}

export function AsyncDistinctValueObservableContextEmit<T>(context: IAsyncDistinctValueObservableContext<T>, promise: Promise<T>, token?: ICancelToken): Promise<void> {
  return AsyncDistinctValueObservableEmit<T>(context.observable, promise, token);
}


export class AsyncDistinctValueObservableContext<T> extends ObservableContextBase<T> implements IAsyncDistinctValueObservableContext<T> {
  protected constructor(observable: IAsyncDistinctValueObservable<T>) {
    super(observable);
  }

  get observable(): IAsyncDistinctValueObservable<T> {
    return ((this as unknown) as IObservableContextBaseInternal<T>)[OBSERVABLE_CONTEXT_BASE_PRIVATE].observable as IAsyncDistinctValueObservable<T>;
  }

  emit(promise: Promise<T>, token?: ICancelToken): Promise<void> {
    return AsyncDistinctValueObservableContextEmit<T>(this, promise, token);
  }

}







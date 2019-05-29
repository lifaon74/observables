import {
  IObservableInternal, ObservableIsFreshlyObserved, ObservableIsNotObserved
} from '../../../core/observable/implementation';
import { IObservable } from '../../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  IAsyncFunctionObservable, TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters,
  TAsyncFunctionObservableFactoryReturnType, TAsyncFunctionObservableParameters,
  TAsyncFunctionObservableParametersUnion, TAsyncFunctionObservableValue
} from './interfaces';
import { IReadonlyTuple } from '../../../misc/readonly-list/interfaces';
import { ReadonlyTuple } from '../../../misc/readonly-list/implementation';
import { IObserver } from '../../../core/observer/interfaces';
import { Observer } from '../../../core/observer/public';
import { IAsyncValueObservableContext } from '../async-value-observable/interfaces';
import { AsyncValueObservable } from '../async-value-observable/implementation';
import { IPromiseCancelToken } from '../../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import {
  PromiseCancelReason, PromiseCancelToken
} from '../../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { FUNCTION_OBSERVABLE_PRIVATE, IFunctionObservableInternal } from '../function-observable/implementation';
import { IsObject } from '../../../helpers';
import { HasFactoryWaterMark } from '../../../classes/factory';


export const ASYNC_FUNCTION_OBSERVABLE_PRIVATE = Symbol('async-function-observable-private');

export interface IAsyncFunctionObservablePrivate<T extends TAsyncFunctionObservableFactory> {
  context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>>;
  factory: T;
  args: TAsyncFunctionObservableParameters<T>;
  readonlyArguments: IReadonlyTuple<TAsyncFunctionObservableParameters<T>>;
  argumentsObserver: IObserver<TAsyncFunctionObservableParametersUnion<T>>;
  argumentsObserverCount: number;
  argumentsObserverPauseCount: number;
  values: TAsyncFunctionObservableFactoryParameters<T>;
}

export interface IAsyncFunctionObservableInternal<T extends TAsyncFunctionObservableFactory> extends IAsyncFunctionObservable<T>, IObservableInternal<TAsyncFunctionObservableValue<T>> {
  [ASYNC_FUNCTION_OBSERVABLE_PRIVATE]: IAsyncFunctionObservablePrivate<T>;
}


export function ConstructAsyncFunctionObservable<T extends TAsyncFunctionObservableFactory>(
  observable: IAsyncFunctionObservable<T>,
  context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>>,
  factory: T,
  args: TAsyncFunctionObservableParameters<T>
): void {
  ConstructClassWithPrivateMembers(observable, ASYNC_FUNCTION_OBSERVABLE_PRIVATE);
  const privates: IAsyncFunctionObservablePrivate<T> = (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.factory = factory;
  privates.args = Array.from(args) as TAsyncFunctionObservableParameters<T>;
  privates.readonlyArguments = new ReadonlyTuple<TAsyncFunctionObservableParameters<T>>(
    privates.args
  );

  privates.values = Array.from({ length: privates.args.length }, () => void 0) as TAsyncFunctionObservableFactoryParameters<T>;

  privates.argumentsObserver = new Observer<TAsyncFunctionObservableParametersUnion<T>>((value: TAsyncFunctionObservableParametersUnion<T>, argObservable: IObservable<TAsyncFunctionObservableParametersUnion<T>>) => {
    AsyncFunctionObservableSetObservableValue<T>(observable, argObservable, value);
    if (privates.argumentsObserverPauseCount === -1) {
      AsyncFunctionObservableCallFactory<T>(observable)
        .catch(PromiseCancelReason.discard);
    }
  }).observe(...Array.from(new Set(privates.args))); // ensure we observe it only once

  privates.argumentsObserverCount = 0;
  privates.argumentsObserverPauseCount = -1;
}

export function IsAsyncFunctionObservable(value: any): value is IAsyncFunctionObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_FUNCTION_OBSERVABLE_PRIVATE as symbol);
}

const IS_ASYNC_FUNCTION_OBSERVABLE_CONSTRUCTOR = Symbol('is-async-function-observable-constructor');

export function IsAsyncFunctionObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function') && ((value === AsyncFunctionObservable) || HasFactoryWaterMark(value, IS_ASYNC_FUNCTION_OBSERVABLE_CONSTRUCTOR, direct));
}


export function AsyncFunctionObservableOnObserved<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): void {
  if (ObservableIsFreshlyObserved<TAsyncFunctionObservableValue<T>>(observable)) {
    (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.activate();
  }
}

export function AsyncFunctionObservableOnUnobserved<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): void {
  if (ObservableIsNotObserved<TAsyncFunctionObservableValue<T>>(observable)) {
    (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.deactivate();
  }
}


export function AsyncFunctionObservableSetObservableValue<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>, argObservable: IObservable<TAsyncFunctionObservableParametersUnion<T>>, value: TAsyncFunctionObservableParametersUnion<T>): void {
  let index: number = -1;
  while ((index = (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].args.indexOf(argObservable as any, index + 1)) !== -1) {
    ((observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].values as any[])[index] = value;
  }
}


export function AsyncFunctionObservableCallFactory<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): Promise<void> {
  const token: IPromiseCancelToken = new PromiseCancelToken();
  const promise: TAsyncFunctionObservableFactoryReturnType<T> = (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].factory.apply(
    null,
    [token].concat((observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].values)
  );
  return (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].context.emit(promise, token);
}

export function AsyncFunctionObservablePause<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): void {
  ((observable as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount = ((observable as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverCount;
}

export function AsyncFunctionObservableResume<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): Promise<void> {
  const argumentsObserverPauseCount: number = ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount;
  ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount = -1;
  if (((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverCount == argumentsObserverPauseCount) {
    return Promise.resolve();
  } else {
    return AsyncFunctionObservableCallFactory<T>(observable);
  }
}


export function AsyncFunctionObservableRun<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>, callback: () => void): Promise<void> {
  AsyncFunctionObservablePause<T>(observable);
  return new Promise<void>((resolve: any) => {
    resolve(callback.call(observable));
  })
    .finally(() => {
      return AsyncFunctionObservableResume<T>(observable);
    });
}


export class AsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends AsyncValueObservable<TAsyncFunctionObservableValue<T>> implements IAsyncFunctionObservable<T> {

  static create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TAsyncFunctionObservableParameters<T>) => IAsyncFunctionObservable<T> {
    return (...args: TAsyncFunctionObservableParameters<T>) => {
      return new AsyncFunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TAsyncFunctionObservableParameters<T>) {
    let context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>>;
    super((_context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>>) => {
      context = _context;
      return {
        onObserved: (): void => {
          AsyncFunctionObservableOnObserved<T>(this);
        },
        onUnobserved: (): void => {
          AsyncFunctionObservableOnUnobserved<T>(this);
        },
      };
    });
    // @ts-ignore
    ConstructAsyncFunctionObservable<T>(this, context, factory, args);
  }

  get factory(): T {
    return ((this as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].factory;
  }

  get args(): IReadonlyTuple<TAsyncFunctionObservableParameters<T>> {
    return ((this as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
  }

  pause(): void {
    AsyncFunctionObservablePause<T>(this);
  }

  resume(): Promise<void> {
    return AsyncFunctionObservableResume<T>(this);
  }

  run(callback: (this: this) => void): Promise<this> {
    return AsyncFunctionObservableRun<T>(this, callback)
      .then(() => this);
  }

}




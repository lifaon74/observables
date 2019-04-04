import { IObservableInternal, OBSERVABLE_PRIVATE } from '../../core/observable/implementation';
import { IObservable } from '../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IAsyncFunctionObservable, ISourceAsyncFunctionObservable, TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters, TAsyncFunctionObservableFactoryReturnType, TAsyncFunctionObservableParameters, TAsyncFunctionObservableParametersUnion, TAsyncFunctionObservableValue, TSourceAsyncFunctionObservableParameters } from './interfaces';
import { IReadonlyTuple } from '../../misc/readonly-list/interfaces';
import { ReadonlyTuple } from '../../misc/readonly-list/implementation';
import { IObserver } from '../../core/observer/interfaces';
import { Observer } from '../../core/observer/public';
import { IAsyncValueObservableContext } from '../async-value-observable/interfaces';
import { AsyncValueObservable } from '../async-value-observable/implementation';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { PromiseCancelReason, PromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { ISource } from '../source/interfaces';


export const ASYNC_FUNCTION_OBSERVABLE_PRIVATE = Symbol('async-function-observable-private');

export interface IAsyncFunctionObservablePrivate<T extends TAsyncFunctionObservableFactory> {
  context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>>;
  factory: T;
  arguments: TAsyncFunctionObservableParameters<T>;
  readonlyArguments: IReadonlyTuple<TAsyncFunctionObservableParameters<T>>;
  argumentsObserver: IObserver<TAsyncFunctionObservableParametersUnion<T>>;
  values: TAsyncFunctionObservableFactoryParameters<T>;
  enableArgumentsObserver: boolean;
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
  privates.arguments = Array.from(args) as TAsyncFunctionObservableParameters<T>;
  privates.readonlyArguments = new ReadonlyTuple<TAsyncFunctionObservableParameters<T>>(
    privates.arguments
  );

  privates.values = Array.from({ length: privates.arguments.length }, () => void 0) as TAsyncFunctionObservableFactoryParameters<T> ;

  privates.argumentsObserver = new Observer<TAsyncFunctionObservableParametersUnion<T>>((value: TAsyncFunctionObservableParametersUnion<T>, _observable: IObservable<TAsyncFunctionObservableParametersUnion<T>>) => {
    if (privates.enableArgumentsObserver) {
      let index: number = -1;
      while ((index = privates.arguments.indexOf(_observable as any, index + 1)) !== -1) {
        privates.values[index] = value;
      }
      AsyncFunctionObservableCallFactory<T>(observable)
        .catch(PromiseCancelReason.discard);
    }
  }).observe(...Array.from(new Set(privates.arguments))); // ensure we observe it only once

  privates.enableArgumentsObserver = true;
}

export function AsyncFunctionObservableOnObserved<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): void {
  if ((observable as IAsyncFunctionObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 1) {
    (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.activate();
  }
}

export function AsyncFunctionObservableOnUnobserved<T extends TAsyncFunctionObservableFactory>(observable: IAsyncFunctionObservable<T>): void {
  if ((observable as IAsyncFunctionObservableInternal<T>)[OBSERVABLE_PRIVATE].observers.length === 0) {
    (observable as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.deactivate();
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


export class AsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends AsyncValueObservable<TAsyncFunctionObservableValue<T>> implements IAsyncFunctionObservable<T> {

  static create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TAsyncFunctionObservableParameters<T>) => IAsyncFunctionObservable<T> {
    return (...args: TAsyncFunctionObservableParameters<T>) => {
      return new AsyncFunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TAsyncFunctionObservableParameters<T>) {
    let context: IAsyncValueObservableContext<TAsyncFunctionObservableValue<T>> = void 0;
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
    ConstructAsyncFunctionObservable<T>(this, context, factory, args);
  }

  get factory(): T {
    return ((this as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].factory;
  }

  get arguments(): IReadonlyTuple<TAsyncFunctionObservableParameters<T>> {
    return ((this as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
  }

}

/*------------------------------*/

export function SourceAsyncFunctionObservableCall<T extends TAsyncFunctionObservableFactory>(observable: ISourceAsyncFunctionObservable<T>, args: TAsyncFunctionObservableFactoryParameters<T>): Promise<void> {
  const privates: IAsyncFunctionObservablePrivate<T> = ((observable as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];

  privates.enableArgumentsObserver = false;
  for (let i = 0, l = privates.arguments.length; i < l ; i++) {
    (privates.arguments[i] as ISource<any>).emit(args[i]);
    privates.values[i] = args[i];
  }
  privates.enableArgumentsObserver = true;

  return AsyncFunctionObservableCallFactory<T>(observable);
}


export class SourceAsyncFunctionObservable<T extends TAsyncFunctionObservableFactory> extends AsyncFunctionObservable<T> implements ISourceAsyncFunctionObservable<T> {
  static create<T extends TAsyncFunctionObservableFactory>(factory: T): (...args: TSourceAsyncFunctionObservableParameters<T>) => ISourceAsyncFunctionObservable<T> {
    return (...args: TSourceAsyncFunctionObservableParameters<T>) => {
      return new SourceAsyncFunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TSourceAsyncFunctionObservableParameters<T>) {
    super(factory, args);
  }

  get arguments(): IReadonlyTuple<TSourceAsyncFunctionObservableParameters<T>> {
    return ((this as unknown) as IAsyncFunctionObservableInternal<T>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments as IReadonlyTuple<TSourceAsyncFunctionObservableParameters<T>>;
  }

  call(...args: TAsyncFunctionObservableFactoryParameters<T>): Promise<this> {
    return SourceAsyncFunctionObservableCall<T>(this, args)
      .then(() => this);
  }
}




import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { IsObject } from '../../helpers';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import { TPromise, TPromiseOrValue } from '../interfaces';
import { ICancellablePromiseOptions, TCancellablePromiseCreateCallback } from './types';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsPromiseLikeBase } from '../helpers';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IsAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/constructor';

/** CONSTRUCTOR **/

export function ConstructCancellablePromise<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  promiseOrCallback: TPromise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  signal: IAdvancedAbortSignal,
  options: ICancellablePromiseOptions<T, TStrategy> = {}
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  if (CHECK_CANCELLABLE_PROMISE_CONSTRUCT) {
    if (IsAdvancedAbortSignal(signal)) {
      privates.signal = signal;
    } else {
      throw new TypeError(`Expected AdvancedAbortSignal as CancellablePromise second argument.`);
    }

    if (IsObject(options))  {
      if (options.strategy === void 0) {
        privates.strategy = 'never' as TStrategy;
      } else if (['resolve', 'reject', 'never'].includes(options.strategy)) {
        privates.strategy = options.strategy;
      } else {
        throw new TypeError(`Expected 'resolve', 'reject', 'never' or void as options.strategy`);
      }
    } else {
      throw new TypeError(`Expected object or void as CancellablePromise third argument.`);
    }

    if (typeof promiseOrCallback === 'function') {
      privates.isCancellablePromiseWithSameSignal = false;
      // ensures promiseOrCallback is called only if signal is not cancelled
      privates.promise = privates.signal.wrapFunction<() => TPromise<T>, TStrategy, never>(() => {
        return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, privates.signal);
        });
      }, privates)();
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T, TStrategy>(promiseOrCallback, instance);
      privates.promise = privates.isCancellablePromiseWithSameSignal
        ? promiseOrCallback
        : privates.signal.wrapPromise<T, TStrategy, never>(promiseOrCallback, privates);
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }



  } else {
    privates.signal = signal as IAdvancedAbortSignal;
    privates.strategy = options.strategy as TStrategy;
    privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T, TStrategy>(promiseOrCallback, instance);
    privates.promise = promiseOrCallback as Promise<T | TAbortStrategyReturn<TStrategy>>;
  }
}

export function IsCancellablePromise(value: any): value is ICancellablePromise<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameSignal<T, TStrategy extends TAbortStrategy>(value: any, instance: ICancellablePromise<T, TStrategy>): boolean {
  return IsCancellablePromise(value)
    && (value.signal === instance.signal);
}

/** NEW **/

let CHECK_CANCELLABLE_PROMISE_CONSTRUCT: boolean = true;

export function NewCancellablePromise<T, TStrategy extends TAbortStrategy>(
  _constructor: ICancellablePromiseConstructor,
  promise: TPromise<T>,
  signal: IAdvancedAbortSignal,
  options: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T, TStrategy> = new _constructor(promise, signal, options);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TStrategy extends TAbortStrategy, TPromiseValue>(
  instance: ICancellablePromise<T, TStrategy>,
  promise: TPromise<TPromiseValue>,
  signal: IAdvancedAbortSignal = instance.signal,
  options: ICancellablePromiseOptions<T, TStrategy> = {},
): ICancellablePromise<TPromiseValue, TStrategy> {
  if (options.strategy === void 0) {
    options.strategy = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].strategy;
  }
  return NewCancellablePromise<TPromiseValue, TStrategy>(instance.constructor as ICancellablePromiseConstructor, promise, signal, options);
}

import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { IsObject } from '../../helpers';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import { TPromise, TPromiseOrValue } from '../interfaces';
import {
  ICancellablePromiseNormalizedOptions, ICancellablePromiseOptions, TCancellablePromisePromiseOrCallback
} from './types';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsPromiseLikeBase } from '../helpers';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { NormalizeICancellablePromiseOptions } from './functions';

/** CONSTRUCTOR **/

export function ConstructCancellablePromise<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  promiseOrCallback: TCancellablePromisePromiseOrCallback<T, TStrategy>,
  options?: ICancellablePromiseOptions<TStrategy>
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];


  if (CHECK_CANCELLABLE_PROMISE_CONSTRUCT) {
    const _options: ICancellablePromiseNormalizedOptions<TStrategy> = NormalizeICancellablePromiseOptions<TStrategy>(options);
    privates.signal = _options.signal;
    privates.strategy = _options.strategy as TStrategy;

    if (typeof promiseOrCallback === 'function') {
      privates.isCancellablePromiseWithSameSignal = false;
      // ensures promiseOrCallback is called only if signal is not cancelled
      privates.promise = privates.signal.wrapFunction<() => TPromise<T>, TStrategy, never>((): TPromise<T> => {
        return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, {
            signal: privates.signal,
            strategy: privates.strategy,
          } as ICancellablePromiseNormalizedOptions<TStrategy>);
        });
      }, privates)() as TPromise<T | TAbortStrategyReturn<TStrategy>>;
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T, TStrategy>(promiseOrCallback, instance);
      privates.promise = (
        privates.isCancellablePromiseWithSameSignal
          ? promiseOrCallback
          : privates.signal.wrapPromise<T, TStrategy, never>(promiseOrCallback, privates)
      ) as TPromise<T | TAbortStrategyReturn<TStrategy>>;
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }


  } else {
    const _options: ICancellablePromiseNormalizedOptions<TStrategy> = options as ICancellablePromiseNormalizedOptions<TStrategy>;
    privates.signal = _options.signal;
    privates.strategy = _options.strategy as TStrategy;
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
  options: ICancellablePromiseNormalizedOptions<TStrategy>
): ICancellablePromise<T, TStrategy> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T, TStrategy> = new _constructor(promise, options);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TStrategy extends TAbortStrategy, TPromiseValue>(
  instance: ICancellablePromise<T, TStrategy>,
  promise: TPromise<TPromiseValue>,
  options?: ICancellablePromiseOptions<TStrategy>,
): ICancellablePromise<TPromiseValue, TStrategy> {
  return NewCancellablePromise<TPromiseValue, TStrategy>(
    instance.constructor as ICancellablePromiseConstructor,
    promise,
    NormalizeICancellablePromiseOptions<TStrategy>(options, (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE])
  );
}

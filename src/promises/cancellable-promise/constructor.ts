import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { IsObject } from '../../helpers';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import { TPromise, TPromiseOrValue, InferPromiseType } from '../type-helpers';
import {
  ICancellablePromiseNormalizedOptions, ICancellablePromiseOptions, TCancellablePromisePromiseOrCallback
} from './types';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsPromiseLikeBase } from '../helpers';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { NormalizeICancellablePromiseOptions } from './functions';

/** CONSTRUCTOR **/

export function ConstructCancellablePromise<T>(
  instance: ICancellablePromise<T>,
  promiseOrCallback: TCancellablePromisePromiseOrCallback<T>,
  options?: ICancellablePromiseOptions
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];


  if (CHECK_CANCELLABLE_PROMISE_CONSTRUCT) {
    const _options: ICancellablePromiseNormalizedOptions = NormalizeICancellablePromiseOptions(options);
    privates.signal = _options.signal;

    if (typeof promiseOrCallback === 'function') {
      privates.isCancellablePromiseWithSameSignal = false;
      // ensures promiseOrCallback is called only if signal is not cancelled
      const a = privates.signal.wrapFunction<() => TPromise<T>, 'never', never>((): TPromise<T> => {
        return new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, instance);
        });
      }, {
        strategy: 'never'
      })();

      // privates.promise =  as TPromise<T | TAbortStrategyReturn<'never'>>;
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T>(promiseOrCallback, instance);
      privates.promise = (
        privates.isCancellablePromiseWithSameSignal
          ? promiseOrCallback
          : privates.signal.wrapPromise<T, never>(promiseOrCallback, privates)
      ) as TPromise<T | TAbortStrategyReturn>;
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }


  } else {
    const _options: ICancellablePromiseNormalizedOptions = options as ICancellablePromiseNormalizedOptions;
    privates.signal = _options.signal;
    privates.strategy = _options.strategy as TStrategy;
    privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T>(promiseOrCallback, instance);
    privates.promise = promiseOrCallback as Promise<T | TAbortStrategyReturn>;
  }
}

export function IsCancellablePromise(value: any): value is ICancellablePromise<any, any> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameSignal<T>(value: any, instance: ICancellablePromise<T>): boolean {
  return IsCancellablePromise(value)
    && (value.signal === instance.signal);
}

/** NEW **/

let CHECK_CANCELLABLE_PROMISE_CONSTRUCT: boolean = true;

export function NewCancellablePromise<T>(
  _constructor: ICancellablePromiseConstructor,
  promise: TPromise<T>,
  options: ICancellablePromiseNormalizedOptions
): ICancellablePromise<T> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T> = new _constructor(promise, options);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TPromiseValue>(
  instance: ICancellablePromise<T>,
  promise: TPromise<TPromiseValue>,
  options?: ICancellablePromiseOptions,
): ICancellablePromise<TPromiseValue> {
  return NewCancellablePromise<TPromiseValue>(
    instance.constructor as ICancellablePromiseConstructor,
    promise,
    NormalizeICancellablePromiseOptions(options, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE])
  );
}

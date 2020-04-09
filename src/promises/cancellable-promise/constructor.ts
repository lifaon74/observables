import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { IsObject } from '../../helpers';
import {
  CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS, CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal,
  ICancellablePromisePrivate, TCancellablePromisePrivatePromise
} from './privates';
import {
  ICancellablePromiseNormalizedOptions, ICancellablePromiseOptions, TCancellablePromisePromiseOrCallback
} from './types';
import { IsPromiseLikeBase } from '../types/helpers';
import { NormalizeICancellablePromiseOptions } from './functions';
import { TNativePromiseLikeOrValue } from '../types/native';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

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
      privates.promise = privates.signal.wrapFunction<() => Promise<T>, 'never', never>((): Promise<T> => {
        return new Promise<T>((resolve: (value?: TNativePromiseLikeOrValue<T>) => void, reject: (reason?: any) => void) => {
          promiseOrCallback.call(instance, resolve, reject, privates.signal);
        });
      }, CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS)();
    } else if (IsPromiseLikeBase(promiseOrCallback)) {
      privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T>(promiseOrCallback, instance);
      privates.promise = (
        privates.isCancellablePromiseWithSameSignal
          ? promiseOrCallback
          : privates.signal.wrapPromise<T>(promiseOrCallback, CANCELLABLE_PROMISE_DEFAULT_ABORT_SIGNAL_WRAP_OPTIONS)
      ) as TCancellablePromisePrivatePromise<T>;
    } else {
      throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
    }


  } else {
    const _options: ICancellablePromiseNormalizedOptions = options as ICancellablePromiseNormalizedOptions;
    privates.signal = _options.signal;
    privates.isCancellablePromiseWithSameSignal = IsCancellablePromiseWithSameSignal<T>(promiseOrCallback, instance);
    privates.promise = promiseOrCallback as TCancellablePromisePrivatePromise<T>;
  }
}

export function IsCancellablePromise<T = any>(value: any): value is ICancellablePromise<T> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameSignal<T = any>(value: any, instance: ICancellablePromise<T>): boolean {
  return IsCancellablePromise<T>(value)
    && (value.signal === instance.signal);
}

/** NEW **/

let CHECK_CANCELLABLE_PROMISE_CONSTRUCT: boolean = true;

export function NewCancellablePromise<T>(
  _constructor: ICancellablePromiseConstructor,
  promise: Promise<T>,
  options: ICancellablePromiseNormalizedOptions
): ICancellablePromise<T> {
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = false;
  const instance: ICancellablePromise<T> = new _constructor(promise, options);
  CHECK_CANCELLABLE_PROMISE_CONSTRUCT = true;
  return instance;
}

export function NewCancellablePromiseFromInstance<T, TPromiseValue>(
  instance: ICancellablePromise<T>,
  promise: Promise<TPromiseValue>,
  options?: ICancellablePromiseOptions,
): ICancellablePromise<TPromiseValue> {
  return NewCancellablePromise<TPromiseValue>(
    instance.constructor as ICancellablePromiseConstructor,
    promise,
    NormalizeICancellablePromiseOptions(options, {
      signal: (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].signal
    })
  );
}

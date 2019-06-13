import {
  IPromiseCancelToken, TCancelStrategy
} from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { PromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/implementation';
import { ICancellablePromise, TCancellablePromiseCreateCallback } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';
import { TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion } from '../interfaces';
import { Finally, IsPromiseLike } from '../helpers';


export const CANCELLABLE_PROMISE_PRIVATE = Symbol('cancellable-promise-private');

export interface ICancellablePromisePrivate<T> {
  promise: Promise<T>;
  token: IPromiseCancelToken;
}

export interface ICancellablePromiseInternal<T> extends ICancellablePromise<T> {
  [CANCELLABLE_PROMISE_PRIVATE]: ICancellablePromisePrivate<T>;
}


export function ConstructCancellablePromise<T>(
  instance: ICancellablePromise<T>,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>,
  token: IPromiseCancelToken = new PromiseCancelToken(),
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);
  const privates: ICancellablePromisePrivate<T> = (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE];

  if (typeof promiseOrCallback === 'function') {
    privates.promise = token.cancelled
      ? Promise.reject<T>(token.reason)
      : new Promise<T>((resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void) => {
        promiseOrCallback(resolve, reject, token);
      });
  } else if (IsPromiseLike(promiseOrCallback)) {
    privates.promise = promiseOrCallback;
  } else {
    throw new TypeError(`Expected Promise or function as CancellablePromise first argument.`);
  }

  privates.token = token;
}


export function IsCancellablePromise(value: any): value is ICancellablePromise<any> {
  return IsObject(value)
    && value.hasOwnProperty(CANCELLABLE_PROMISE_PRIVATE as symbol);
}

export function IsCancellablePromiseWithSameToken<T>(value: any, instance: ICancellablePromise<T>): boolean {
  return IsCancellablePromise(value)
    && (value.token === instance.token);
}


export function CancellablePromiseToPromise<T>(
  instance: ICancellablePromise<T>,
  strategy?: TCancelStrategy
): Promise<T> {
  return (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.wrapPromise<Promise<T>>((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, strategy);
}

export function CancellablePromiseFulfillInternal<T, TResult>(
  instance: ICancellablePromise<T>,
  onFulfilled: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null,
  value: T,
): TPromiseOrValue<TResult | undefined | T> {
  if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
    return void 0;
  } else if (typeof onFulfilled === 'function') {
    return onFulfilled(value, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
  } else {
    return value;
  }
}

export function CancellablePromiseCatchInternal<T, TResult>(
  instance: ICancellablePromise<T>,
  onRejected: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null,
  reason: any,
): TPromiseOrValue<TResult | undefined | never> {
  if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
    return void 0;
  } else if (typeof onRejected === 'function') {
    return onRejected(reason, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
  } else {
    throw reason;
  }
}


export function CancellablePromiseFinallyInternal<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null,
): TPromiseOrValue<void> {
  if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
    return void 0;
  } else if (typeof onFinally === 'function') {
    return onFinally((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
  } else {
    return void 0;
  }
}


export function CancellablePromiseCancelledInternal<T>(
  instance: ICancellablePromise<T>,
  onCancelled?: ((token: IPromiseCancelToken) => void) | undefined | null
): TPromiseOrValue<void> {
  if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
    if (typeof onCancelled === 'function') {
      return onCancelled((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
    } else {
      return void 0;
    }
  } else {
    return void 0;
  }
}


export function CancellablePromiseThen<T, TResult1 = T, TResult2 = never>(
  instance: ICancellablePromise<T>,
  onFulfilled?: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult2>) | undefined | null
): ICancellablePromise<TResult1 | TResult2> {
  return new CancellablePromise<TResult1 | TResult2>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then((value: T) => {
        return CancellablePromiseFulfillInternal<T, TResult1>(instance, onFulfilled, value) as TPromiseOrValue<TResult1>;
      }, (reason: any) => {
        return CancellablePromiseCatchInternal<T, TResult2>(instance, onRejected, reason) as TPromiseOrValue<TResult2>;
      }),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCatch<T, TResult = never>(
  instance: ICancellablePromise<T>,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
): ICancellablePromise<T | TResult> {
  return new CancellablePromise<T | TResult>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then<T, TResult>(void 0, (reason: any) => {
        return CancellablePromiseCatchInternal<T, TResult>(instance, onRejected, reason) as TPromiseOrValue<TResult>;
      }),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}


export function CancellablePromiseFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return new CancellablePromise<T>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then.apply(
      (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise,
      Finally<T>(() => {
        return CancellablePromiseFinallyInternal<T>(instance, onFinally);
      })
    ) as Promise<T>,
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCancelled<T>(
  instance: ICancellablePromise<T>,
  onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return new CancellablePromise<T>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then.apply(
      (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise,
      Finally<T>(() => {
        return CancellablePromiseCancelledInternal<T>(instance, onCancelled);
      })
    ) as Promise<T>,
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}


export function CancellablePromiseFastThen<T, TResult1 = T, TResult2 = never>(
  instance: ICancellablePromise<T>,
  onFulfilled?: ((value: T, token: IPromiseCancelToken) => TPromiseOrValue<TResult1>) | undefined | null,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult2 | PromiseLike<TResult2>) | undefined | null
): ICancellablePromise<TResult1 | TResult2> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).then<TResult1, TResult2>(onFulfilled, onRejected)
    : CancellablePromiseThen<T, TResult1, TResult2>(instance, onFulfilled, onRejected);
}

export function CancellablePromiseFastCatch<T, TResult = never>(
  instance: ICancellablePromise<T>,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
): ICancellablePromise<T | TResult> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).catch<TResult>(onRejected)
    : CancellablePromiseCatch<T, TResult>(instance, onRejected);
}

export function CancellablePromiseFastFinally<T>(
  instance: ICancellablePromise<T>,
  onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).finally(onFinally)
    : CancellablePromiseFinally<T>(instance, onFinally);
}

export function CancellablePromiseFastCancelled<T>(
  instance: ICancellablePromise<T>,
  onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return IsCancellablePromiseWithSameToken((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise, instance)
    ? ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise as ICancellablePromise<T>).cancelled(onCancelled)
    : CancellablePromiseCancelled<T>(instance, onCancelled);
}


export function CancellablePromiseOf<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && (promiseOrCallback.token === token)
  )
    ? promiseOrCallback
    : new CancellablePromise<T>(promiseOrCallback, token);
}

export class CancellablePromise<T> implements ICancellablePromise<T> {

  static resolve(): CancellablePromise<void>;
  static resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken): CancellablePromise<T>;
  static resolve<T>(value?: TPromiseOrValue<T>, token?: IPromiseCancelToken): CancellablePromise<T | void> {
    return new CancellablePromise<T | void>(Promise.resolve<T | void>(value), token);
  }

  static reject<T = never>(reason?: any, token?: IPromiseCancelToken): CancellablePromise<T> {
    return new CancellablePromise<T>(Promise.reject<T>(reason), token);
  }

  static try<T>(callback: () => TPromiseOrValue<T>, token?: IPromiseCancelToken): CancellablePromise<T> {
    return new CancellablePromise<T>(new Promise<T>((resolve: any) => {
      resolve(callback());
    }), token);
  }

  static race<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): CancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>> {
    return new CancellablePromise<TPromiseOrValueTupleToValueUnion<TTuple>>(Promise.race(values), token);
  }

  static all<TTuple extends TPromiseOrValue<any>[]>(values: TTuple, token?: IPromiseCancelToken): Promise<TPromiseOrValueTupleToValueTuple<TTuple>> {
    return new CancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>>(Promise.all(values) as any, token);
  }

  static of<T>(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken): ICancellablePromise<T> {
    return CancellablePromiseOf<T>(promiseOrCallback, token);
  }

  constructor(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T>, token?: IPromiseCancelToken) {
    ConstructCancellablePromise(this, promiseOrCallback, token);
  }

  get token(): IPromiseCancelToken {
    return ((this as unknown) as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token;
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T, token: IPromiseCancelToken) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): ICancellablePromise<TResult1 | TResult2> {
    return CancellablePromiseFastThen<T, TResult1, TResult2>(this, onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any, token: IPromiseCancelToken) => TPromiseOrValue<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult> {
    return CancellablePromiseFastCatch<T, TResult>(this, onRejected);
  }

  finally(onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseFastFinally<T>(this, onFinally);
  }

  cancelled(onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseFastCancelled<T>(this, onCancelled);
  }

  promise(strategy?: TCancelStrategy): Promise<T> {
    return CancellablePromiseToPromise<T>(this, strategy);
  }
}




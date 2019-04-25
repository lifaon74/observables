import { IPromiseCancelToken } from '../promise-cancel-token/interfaces';
import { PromiseCancelToken } from '../promise-cancel-token/implementation';
import {
  ICancellablePromise,
  TPromiseCreateCallback, TPromiseOrValue, TPromiseOrValueTupleToValueTuple, TPromiseOrValueTupleToValueUnion
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';


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
  promiseOrCallback: Promise<T> | TPromiseCreateCallback<T>,
  token: IPromiseCancelToken = new PromiseCancelToken()
): void {
  ConstructClassWithPrivateMembers(instance, CANCELLABLE_PROMISE_PRIVATE);

  if (typeof promiseOrCallback === 'function') {
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise = new Promise<T>(promiseOrCallback);
  } else if (promiseOrCallback instanceof Promise){
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise = promiseOrCallback;
  } else {
    throw new TypeError(`Expected promise or function as CancellablePromise first argument.`);
  }

  (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token = token;
}


export function CancellablePromiseThen<T, TResult1 = T, TResult2 = never>(
  instance: ICancellablePromise<T>,
  onFulfilled?: ((value: T, token: IPromiseCancelToken) => TResult1 | PromiseLike<TResult1>) | undefined | null,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult2 | PromiseLike<TResult2>) | undefined | null
): ICancellablePromise<TResult1 | TResult2> {
  return new CancellablePromise<TResult1 | TResult2>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .then((value: T) => {
        if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
          return void 0;
        } else if (typeof onFulfilled === 'function') {
          return onFulfilled(value, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
        } else {
          return value as any;
        }
      }, (reason: any) => {
        if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
          return void 0;
        } else if (typeof onRejected === 'function') {
          return onRejected(reason, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
        } else {
          throw reason;
        }
      }),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCatch<T, TResult = never>(
  instance: ICancellablePromise<T>,
  onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult | PromiseLike<TResult>) | undefined | null
): ICancellablePromise<T | TResult> {
  return new CancellablePromise<T | TResult>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .catch((reason: any) => {
        if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
          return void 0;
        } else if (typeof onRejected === 'function') {
          return onRejected(reason, (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
        } else {
          throw reason;
        }
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
      .finally(() => {
        if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
          return void 0;
        } else if (typeof onFinally === 'function') {
          return onFinally((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
        } else {
          return void 0;
        }
      }),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}

export function CancellablePromiseCancelled<T>(
  instance: ICancellablePromise<T>,
  onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null
): ICancellablePromise<T> {
  return new CancellablePromise<T>(
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise
      .finally(() => {
        if ((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token.cancelled) {
          return onCancelled((instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token);
        } else {
          return void 0;
        }
      }),
    (instance as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].token
  );
}


export class CancellablePromise<T> implements ICancellablePromise<T> {

  static resolve(): CancellablePromise<void>;
  static resolve<T>(value: TPromiseOrValue<T>, token?: IPromiseCancelToken): CancellablePromise<T>;
  static resolve<T>(value?: TPromiseOrValue<T>, token?: IPromiseCancelToken): CancellablePromise<T> {
    return new CancellablePromise<T>(Promise.resolve<T>(value), token);
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


  constructor(promiseOrCallback: Promise<T> | TPromiseCreateCallback<T>, token?: IPromiseCancelToken) {
    ConstructCancellablePromise(this, promiseOrCallback, token);
  }

  get promise(): Promise<T> {
    return ((this as unknown) as ICancellablePromiseInternal<T>)[CANCELLABLE_PROMISE_PRIVATE].promise;
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
    return CancellablePromiseThen<T, TResult1, TResult2>(this, onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any, token: IPromiseCancelToken) => TResult | PromiseLike<TResult>) | undefined | null
  ): ICancellablePromise<T | TResult> {
    return CancellablePromiseCatch<T, TResult>(this, onRejected);
  }

  finally(onFinally?: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseFinally<T>(this, onFinally);
  }

  cancelled(onCancelled: ((token: IPromiseCancelToken) => void) | undefined | null): ICancellablePromise<T> {
    return CancellablePromiseCancelled<T>(this, onCancelled);
  }

}


// export function testCancellablePromise() {
//   const a = CancellablePromise.resolve(1)
//     .then((value: number, token: IPromiseCancelToken) => {
//       console.log('1', value);
//       token.cancel('cancelled');
//       return value * 2;
//     })
//     .then((value: number) => {
//       console.log('2', value);
//     })
//     .cancelled((token: IPromiseCancelToken) => {
//       console.log('cancelled', token.reason);
//     });
//
//   const b = CancellablePromise.all([Promise.resolve({ a: 1 }), { b: 1 }, 'a'])
//     .then((values) => {
//       console.log('values', values);
//     });
//
//   console.log(a);
//   // debugger;
// }

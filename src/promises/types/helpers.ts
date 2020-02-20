import { IsObject, noop } from '../../helpers';
import { IPromise, TPromiseCreateCallback } from './promise';
import { IPromiseLike, TPromiseLikeConstraint, TPromiseLikeOrValue } from './promise-like';
import { $Promise } from './constants';
import { IPromiseFulfilledObject, IPromiseRejectedObject, TAllSettledResult } from './others';


export function IsPromiseLike<T extends TPromiseLikeConstraint<T> = unknown>(value: any): value is IPromise<T> {
  return IsPromiseLikeBase(value)
    && (typeof (value as any).catch === 'function')
    && (typeof (value as any).finally === 'function')
    ;
}

export function IsPromiseLikeBase<T extends TPromiseLikeConstraint<T> = unknown>(value: any): value is IPromiseLike<T> {
  return IsObject(value)
    && (typeof (value as any).then === 'function')
    ;
}

export const NEVER_PROMISE: Promise<never> = new Promise<never>(noop);
export const VOID_PROMISE: Promise<void> = Promise.resolve();


export function PromiseCreateCallbackNoop(): TPromiseCreateCallback<never> {
  return () => {
  };
}

export function PromiseCreateCallbackResolve<T extends TPromiseLikeConstraint<T>>(value: T): TPromiseCreateCallback<T> {
  return (resolve: (value?: TPromiseLikeOrValue<T>) => void) => resolve(value);
}

export function PromiseCreateCallbackReject<T extends TPromiseLikeConstraint<T> = never>(reason: any): TPromiseCreateCallback<T> {
  return (resolve: (value?: never) => void, reject: (reason?: any) => void) => reject(reason);
}


export function PromiseTry<T extends TPromiseLikeConstraint<T>>(callback: () => TPromiseLikeOrValue<T>): IPromise<T> {
  return new $Promise<T>(resolve => resolve(callback()));
}

export function EnsuresPromise<T extends TPromiseLikeConstraint<T>>(promise: IPromiseLike<T>): IPromise<T> {
  return IsPromiseLike<T>(promise)
    ? promise
    : $Promise.resolve<T>(promise);
}

export type TPromiseFinallySpreadArguments<T extends TPromiseLikeConstraint<T>> = [
  ((value: T) => TPromiseLikeOrValue<T>) | undefined | null,
  ((reason: any) => TPromiseLikeOrValue<never>) | undefined | null
];

export function PromiseFinally<T extends TPromiseLikeConstraint<T>>(onFinally?: (() => void) | undefined | null): TPromiseFinallySpreadArguments<T> {
  return (typeof onFinally === 'function')
    ? [
      (value: T) => {
        return PromiseTry<void>(onFinally)
          .then((): T => value);
      },
      (reason: any) => {
        return PromiseTry<void>(onFinally)
          .then((): never => {
            throw reason;
          });
      }
    ] : [void 0, void 0];
}

export type TPromiseFinallySpreadArgumentsNonConstrained<T> =
  [T] extends [TPromiseLikeConstraint<T>]
    ? TPromiseFinallySpreadArguments<T>
    : never;

export function PromiseFinallyNonConstrained<T>(...args: Parameters<typeof PromiseFinally>): TPromiseFinallySpreadArgumentsNonConstrained<T> {
  return PromiseFinally<unknown>(...args) as TPromiseFinallySpreadArgumentsNonConstrained<T>;
}

export function PromiseAllSettled<T extends TPromiseLikeConstraint<T>>(promises: Iterable<IPromise<T>>): IPromise<TAllSettledResult<T>[]> {
  return $Promise.all(
    Array.from<IPromise<T>, IPromise<TAllSettledResult<T>>>(promises, (promise: IPromise<T>) => {
      return promise
        .then(
          (value: T): IPromiseFulfilledObject<T> => ({ status: 'fulfilled', value: value }),
          (reason: any): IPromiseRejectedObject => ({ status: 'rejected', reason: reason }),
        );
    })
  );
}

// export function SpreadCancellablePromiseTuple<T>({ promise, controller }: ICancellablePromiseTuple<T>): [TPromise<T>, IAdvancedAbortSignal] {
//   return [promise, controller.signal];
// }

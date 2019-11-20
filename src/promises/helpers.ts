import { IsObject, noop } from '../helpers';
import {
  AllSettledResult, ICancellablePromiseTuple, PromiseFulfilledObject, PromiseRejectedObject, TPromise,
  TPromiseCreateCallback, TPromiseOrValue
} from './interfaces';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';


export function IsPromiseLike(value: any): value is TPromise<any> {
  return IsPromiseLikeBase(value)
    && (typeof (value as any).catch === 'function')
    && (typeof (value as any).finally === 'function')
  ;
}

export function IsPromiseLikeBase(value: any): value is PromiseLike<any> {
  return IsObject(value)
    && (typeof (value as any).then === 'function')
  ;
}

export const NEVER_PROMISE = new Promise<never>(noop);
export const VOID_PROMISE = Promise.resolve();


export function PromiseCreateCallbackNoop(): TPromiseCreateCallback<never> {
  return () => {};
}

export function PromiseCreateCallbackResolve<T>(value: T): TPromiseCreateCallback<T> {
  return (resolve: (value?: TPromiseOrValue<T>) => void) => resolve(value);
}

export function PromiseCreateCallbackReject(reason: any): TPromiseCreateCallback<never> {
  return (resolve: (value?: never) => void, reject: (reason?: any) => void) => reject(reason);
}


export function PromiseTry<T>(callback: () => TPromiseOrValue<T>): TPromise<T> {
  return new Promise<T>(resolve => resolve(callback()));
}

export function EnsuresPromise<T>(promise: PromiseLike<T>): TPromise<T> {
  return (promise instanceof Promise)
    ? promise
    : Promise.resolve(promise);
}


export function Finally<T>(onFinally?: (() => void) | undefined | null): [
  ((value: T) => TPromiseOrValue<T>) | undefined | null,
  ((reason: any) => TPromiseOrValue<never>) | undefined | null
] {
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

export function AllSettled<T>(promises: Iterable<TPromise<T>>): TPromise<AllSettledResult<T>[]> {
  return Promise.all<AllSettledResult<T>>(
    Array.from<TPromise<T>, TPromise<AllSettledResult<T>>>(promises, (promise: TPromise<T>) => {
      return promise
        .then(
          (value: T): PromiseFulfilledObject<T> => ( { status: 'fulfilled', value: value } ),
          (reason: any): PromiseRejectedObject => ( { status: 'rejected', reason: reason } ),
        );
    })
  );
}

export function SpreadCancellablePromiseTuple<T>({ promise, controller }: ICancellablePromiseTuple<T>): [TPromise<T>, IAdvancedAbortSignal] {
  return [promise, controller.signal];
}

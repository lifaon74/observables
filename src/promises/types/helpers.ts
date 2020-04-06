import { IsObject, noop } from '../../helpers';
import {
  INativeCancellablePromiseTuple, INativePromiseFulfilledObject, INativePromiseRejectedObject, TNativeAllSettledResult,
  TNativePromiseCreateCallback, TNativePromiseLikeOrValue
} from './native';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';


export function IsPromiseLike<T>(value: any): value is Promise<T> {
  return IsPromiseLikeBase(value)
    && (typeof (value as any).catch === 'function')
    && (typeof (value as any).finally === 'function')
    ;
}

export function IsPromiseLikeBase<T>(value: any): value is PromiseLike<T> {
  return IsObject(value)
    && (typeof (value as any).then === 'function')
    ;
}

export const NEVER_PROMISE: Promise<never> = new Promise<never>(noop);
export const VOID_PROMISE: Promise<void> = Promise.resolve();


export function PromiseCreateCallbackNoop(): TNativePromiseCreateCallback<never> {
  return () => {
  };
}

export function PromiseCreateCallbackResolve<T>(value: T): TNativePromiseCreateCallback<T> {
  return (resolve: (value?: TNativePromiseLikeOrValue<T>) => void) => resolve(value);
}

export function PromiseCreateCallbackReject<T = never>(reason: any): TNativePromiseCreateCallback<T> {
  return (resolve: (value?: never) => void, reject: (reason?: any) => void) => reject(reason);
}


export function PromiseTry<T>(callback: () => TNativePromiseLikeOrValue<T>): Promise<T> {
  return new Promise<T>(resolve => resolve(callback()));
}

export function EnsuresPromise<T>(promise: PromiseLike<T>): Promise<T> {
  return IsPromiseLike<T>(promise)
    ? promise
    : Promise.resolve<T>(promise);
}

export type TPromiseFinallySpreadArguments<T> = [
  ((value: T) => TNativePromiseLikeOrValue<T>) | undefined | null,
  ((reason: any) => TNativePromiseLikeOrValue<never>) | undefined | null
];

export function PromiseFinally<T>(onFinally?: (() => void) | undefined | null): TPromiseFinallySpreadArguments<T> {
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


export function PromiseAllSettled<T>(promises: Iterable<Promise<T>>): Promise<TNativeAllSettledResult<T>[]> {
  return Promise.all(
    Array.from<Promise<T>, Promise<TNativeAllSettledResult<T>>>(promises, (promise: Promise<T>) => {
      return promise
        .then(
          (value: T): INativePromiseFulfilledObject<T> => ({ status: 'fulfilled', value: value }),
          (reason: any): INativePromiseRejectedObject => ({ status: 'rejected', reason: reason }),
        );
    })
  );
}

export function SpreadCancellablePromiseTuple<T>({ promise, signal }: INativeCancellablePromiseTuple<T>): [Promise<T>, IAdvancedAbortSignal] {
  return [promise, signal];
}

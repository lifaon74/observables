import { IsObject } from '../helpers';
import { ICancellablePromiseTuple, TPromiseCreateCallback, TPromiseOrValue } from './interfaces';
import { IPromiseCancelToken } from '../notifications/observables/complete-state/promise/promise-cancel-token/interfaces';


export function IsPromiseLike(value: any): value is Promise<any> {
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


export function PromiseCreateCallbackNoop(): TPromiseCreateCallback<never> {
  return () => {};
}

export function PromiseCreateCallbackResolve<T>(value: T): TPromiseCreateCallback<T> {
  return (resolve: (value?: TPromiseOrValue<T>) => void) => resolve(value);
}

export function PromiseCreateCallbackReject(reason: any): TPromiseCreateCallback<never> {
  return (resolve: (value?: never) => void, reject: (reason?: any) => void) => reject(reason);
}

export function PromiseTry<T>(callback: () => TPromiseOrValue<T>): Promise<T> {
  return new Promise<T>(resolve => resolve(callback()));
}

export function EnsuresPromise<T>(promise: PromiseLike<T>): Promise<T> {
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
        return new Promise<void>(resolve => resolve(onFinally()))
          .then<T, never>(() => value);
      },
      (reason: any) => {
        return new Promise<void>(resolve => resolve(onFinally()))
          .then<never, never>(() => {
            throw reason;
          });
      }
    ] : [void 0, void 0];
}

export interface AllSettledFulfilled<T> {
  status: 'fulfilled';
  value: T;
}

export interface AllSettledRejected {
  status: 'rejected';
  reason: any;
}

export type AllSettledResult<T> = AllSettledFulfilled<T> | AllSettledRejected;

export function AllSettled<T>(promises: Iterable<Promise<T>>): Promise<AllSettledResult<T>[]> {
  return Promise.all<AllSettledResult<T>>(
    Array.from<Promise<T>, Promise<AllSettledResult<T>>>(promises, (promise: Promise<T>) => {
      return promise
        .then<AllSettledFulfilled<T>, AllSettledRejected>(
          (value: T) => ( { status: 'fulfilled', value: value } ),
          (reason: any) => ( { status: 'rejected', reason: reason } ),
        );
    })
  );
}

export function SpreadCancellablePromiseTuple<T>({ promise, token }: ICancellablePromiseTuple<T>): [Promise<T>, IPromiseCancelToken] {
  return [promise, token ];
}

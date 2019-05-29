import { IsObject } from '../helpers';
import { TPromiseOrValue } from './interfaces';

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

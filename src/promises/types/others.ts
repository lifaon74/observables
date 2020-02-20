import { TPromiseLikeConstraint } from './promise-like';

export interface IPromiseFulfilledObject<T extends TPromiseLikeConstraint<T>> {
  status: 'fulfilled';
  value: T;
}

export interface IPromiseRejectedObject {
  status: 'rejected';
  reason: any;
}

export type TAllSettledResult<T extends TPromiseLikeConstraint<T>> = IPromiseFulfilledObject<T> | IPromiseRejectedObject;


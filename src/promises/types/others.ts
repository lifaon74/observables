import { TPromiseLikeConstraint } from './promise-like';
import { INativePromiseFulfilledObject, INativePromiseRejectedObject, TNativeAllSettledResult } from './native';


export interface IPromiseFulfilledObject<T extends TPromiseLikeConstraint<T>> extends INativePromiseFulfilledObject<T> {
}

export interface IPromiseRejectedObject extends INativePromiseRejectedObject {
}

export type TAllSettledResult<T extends TPromiseLikeConstraint<T>> = TNativeAllSettledResult<T>;


import { IAdvancedAbortSignal } from './interfaces';
import { IAdvancedAbortController } from '../interfaces';
import { TInferNativePromiseLikeOrValue, TNativePromiseLikeOrValue } from '../../../promises/types/native';

/** TYPES **/

// list of strategies to apply to a promise when aborted
export type TAbortStrategy =
  'resolve' // resolve the promise with void
  | 'reject' // reject the promise with the AdvancedAbortSignal's reason
  | 'never' // (default) never resolve the promise, it stays in a pending state forever
  ;

export type TInferAbortStrategyReturn<TStrategy extends TAbortStrategy> =
  TStrategy extends 'resolve'
    ? void
    : TStrategy extends 'reject'
    ? never
    : never;

// export type TInferAbortStrategyReturnConstrained<TStrategy extends TAbortStrategy> =
//   TInferAbortStrategyReturn<TStrategy> extends TPromiseLikeConstraint<TInferAbortStrategyReturn<TStrategy>>
//    ? TInferAbortStrategyReturn<TStrategy>
//   : never;

/* WRAP PROMISE */

// infers the returned promise supporting an AdvancedAbortSignal
export type TInferAbortStrategyReturnedPromise<T, TStrategy extends TAbortStrategy, TAborted> =
  Promise<T | TInferAbortStrategyReturn<TStrategy> | TAborted>;

// a callback which may be provided to the 'wrapFunction' of an an AdvancedAbortSignal
export type TAdvancedAbortSignalWrapPromiseCallback<T> = (
  this: IAdvancedAbortSignal,
  resolve: (value?: TNativePromiseLikeOrValue<T>) => void,
  reject: (reason?: any) => void,
  signal: IAdvancedAbortSignal
) => void;

// the first argument which may be provided to the 'wrapPromise' of an an AdvancedAbortSignal
export type TAdvancedAbortSignalWrapPromiseArgument<T> =
  PromiseLike<T>
  | TAdvancedAbortSignalWrapPromiseCallback<T>;

//  the second argument which may be provided to the 'wrapPromise' of an an AdvancedAbortSignal
export interface IAdvancedAbortSignalWrapPromiseOptions<TStrategy extends TAbortStrategy, TAborted> {
  strategy?: TStrategy; // (default: 'never') how to resolve the promise if signal is aborted
  onAborted?: TCatchAbortedCallback<TAborted, TStrategy>; // callback to call when the signal is aborted => we may change the promise state from 'aborted' to something else
  onAbortedController?: IAdvancedAbortController; // controller provided to the 'onAborted' function
}

// definition of the callback to call when the signal is aborted
export type TCatchAbortedCallback<T, TStrategy extends TAbortStrategy> = (
  this: IAdvancedAbortSignal,
  reason: any,
  newController: IAdvancedAbortController // a new controller is provided if we want to abort the promise
) => TNativePromiseLikeOrValue<T | TInferAbortStrategyReturn<TStrategy>>;


/* WRAP FUNCTION */

// infers the return type of the 'wrapFunction' of an an AdvancedAbortSignal
export type TInferAdvancedAbortSignalWrapFunctionReturn<CB extends (...args: any[]) => any, TStrategy extends TAbortStrategy, TAborted> =
  (...args: Parameters<CB>) => TInferAbortStrategyReturnedPromise<TInferNativePromiseLikeOrValue<ReturnType<CB>>, TStrategy, TAborted>;


/* OTHERS */

export interface IAdvancedAbortSignalKeyValueMap {
  abort: any;
}

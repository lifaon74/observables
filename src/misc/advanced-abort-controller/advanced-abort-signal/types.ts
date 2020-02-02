import { TPromise, TPromiseOrValue } from '../../../promises/interfaces';
import { IAdvancedAbortSignal } from './interfaces';
import { IAdvancedAbortController } from '../interfaces';

/** TYPES **/

export type TAbortStrategy =
  'resolve' // resolve the promise with void
  | 'reject' // reject the promise with the AdvancedAbortSignal's reason
  | 'never' // (default) never resolve the promise, it stays in a pending state forever
  ;

export type TAbortStrategyReturn<TStrategy extends TAbortStrategy> =
  TStrategy extends 'resolve'
    ? void
    : TStrategy extends 'reject'
    ? never
    : never;

export type TAbortStrategyReturnedPromise<T, TStrategy extends TAbortStrategy, TAborted> = TPromise<T | TAbortStrategyReturn<TStrategy> | TAborted>;


export type TAdvancedAbortSignalWrapPromiseCallback<T> = (
  this: IAdvancedAbortSignal,
  resolve: (value?: TPromiseOrValue<T>) => void,
  reject: (reason?: any) => void,
  signal: IAdvancedAbortSignal
) => void;

export type TCatchAborted<T, TStrategy extends TAbortStrategy> = (
  this: IAdvancedAbortSignal,
  reason: any,
  newController: IAdvancedAbortController // a new controller is provided if we want to abort the promise
) => TPromiseOrValue<T | TAbortStrategyReturn<TStrategy>>;


export interface IAdvancedAbortSignalWrapPromiseOptions<TStrategy extends TAbortStrategy, TAborted> {
  strategy?: TStrategy; // how to resolve the promise if signal is aborted
  onAborted?: TCatchAborted<TAborted, TStrategy>; // callback to call when the signal is aborted => we may change the promise state from 'aborted' to something else
  onAbortedController?: IAdvancedAbortController; // controller provided to the 'onAborted' function
}

export interface IAdvancedAbortSignalKeyValueMap {
  abort: any;
}

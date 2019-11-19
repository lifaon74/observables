import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters, TAsyncFunctionObservableParameters,
  TAsyncFunctionObservableParametersUnion, TAsyncFunctionObservableValue
} from './types';
import { IAsyncDistinctValueObservablePrivatesInternal } from '../../distinct-value-observable/async/privates';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';
import { IReadonlyTuple } from '../../../../misc/readonly-list/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { IAsyncFunctionObservable } from './interfaces';

/** PRIVATES **/

export const ASYNC_FUNCTION_OBSERVABLE_PRIVATE = Symbol('async-function-observable-private');

export interface IAsyncFunctionObservablePrivate<TFactory extends TAsyncFunctionObservableFactory> {
  context: IAsyncDistinctValueObservableContext<TAsyncFunctionObservableValue<TFactory>>;
  factory: TFactory;
  args: TAsyncFunctionObservableParameters<TFactory>;
  readonlyArguments: IReadonlyTuple<TAsyncFunctionObservableParameters<TFactory>>;
  argumentsObserver: IObserver<TAsyncFunctionObservableParametersUnion<TFactory>>;
  argumentsObserverCount: number;
  argumentsObserverPauseCount: number;
  values: TAsyncFunctionObservableFactoryParameters<TFactory>;
}

export interface IAsyncFunctionObservablePrivatesInternal<TFactory extends TAsyncFunctionObservableFactory> extends IAsyncDistinctValueObservablePrivatesInternal<TFactory> {
  [ASYNC_FUNCTION_OBSERVABLE_PRIVATE]: IAsyncFunctionObservablePrivate<TFactory>;
}

export interface IAsyncFunctionObservableInternal<TFactory extends TAsyncFunctionObservableFactory> extends IAsyncFunctionObservablePrivatesInternal<TFactory>, IAsyncFunctionObservable<TFactory> {
}

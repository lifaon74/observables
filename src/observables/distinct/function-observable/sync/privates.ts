import {
  TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters,
  TFunctionObservableParametersUnion, TFunctionObservableValue
} from './types';
import { IDistinctValueObservableContext } from '../../distinct-value-observable/sync/context/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { IFunctionObservable } from './interfaces';
import { IDistinctValueObservablePrivatesInternal } from '../../distinct-value-observable/sync/privates';
import { IReadonlyTuple } from '../../../../misc/readonly-tuple/interfaces';

/** PRIVATES **/

export const FUNCTION_OBSERVABLE_PRIVATE = Symbol('function-observable-private');

export interface IFunctionObservablePrivate<TFactory extends TFunctionObservableFactory> {
  context: IDistinctValueObservableContext<TFunctionObservableValue<TFactory>>;
  factory: TFactory;
  args: TFunctionObservableParameters<TFactory>;
  readonlyArguments: IReadonlyTuple<TFunctionObservableParameters<TFactory>>;
  argumentsObserver: IObserver<TFunctionObservableParametersUnion<TFactory>>;
  argumentsObserverCount: number;
  argumentsObserverPauseCount: number;
  values: TFunctionObservableFactoryParameters<TFactory>;
}

export interface IFunctionObservablePrivatesInternal<TFactory extends TFunctionObservableFactory> extends IDistinctValueObservablePrivatesInternal<TFunctionObservableValue<TFactory>> {
  [FUNCTION_OBSERVABLE_PRIVATE]: IFunctionObservablePrivate<TFactory>;
}

export interface IFunctionObservableInternal<TFactory extends TFunctionObservableFactory> extends IFunctionObservablePrivatesInternal<TFactory>, IFunctionObservable<TFactory> {
}

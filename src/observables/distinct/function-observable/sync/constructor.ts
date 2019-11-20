import { HasFactoryWaterMark } from '../../../../classes/class-helpers/factory';
import {
  TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters,
  TFunctionObservableParametersUnion, TFunctionObservableValue
} from './types';
import { IFunctionObservable } from './interfaces';
import { IDistinctValueObservableContext } from '../../distinct-value-observable/sync/context/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { FUNCTION_OBSERVABLE_PRIVATE, IFunctionObservableInternal, IFunctionObservablePrivate } from './privates';
import { ReadonlyTuple } from '../../../../misc/readonly-list/implementation';
import { Observer } from '../../../../core/observer/implementation';
import { IObservable } from '../../../../core/observable/interfaces';
import { IsObject } from '../../../../helpers';
import { DISTINCT_VALUE_OBSERVABLE_PRIVATE } from '../../distinct-value-observable/sync/privates';
import { FunctionObservableCallFactory, FunctionObservableSetObservableValue } from './functions';

/** CONSTRUCTOR **/

export function ConstructFunctionObservable<TFactory extends TFunctionObservableFactory>(
  instance: IFunctionObservable<TFactory>,
  context: IDistinctValueObservableContext<TFunctionObservableValue<TFactory>>,
  factory: TFactory,
  args: TFunctionObservableParameters<TFactory>
): void {
  ConstructClassWithPrivateMembers(instance, FUNCTION_OBSERVABLE_PRIVATE);
  const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.factory = factory;
  privates.args = Array.from(args) as TFunctionObservableParameters<TFactory>;
  privates.readonlyArguments = new ReadonlyTuple<TFunctionObservableParameters<TFactory>>(privates.args);

  privates.values = Array.from({ length: privates.args.length }, () => void 0) as TFunctionObservableFactoryParameters<TFactory>;

  privates.argumentsObserver = new Observer<TFunctionObservableParametersUnion<TFactory>>((value: TFunctionObservableParametersUnion<TFactory>, argObservable?: IObservable<TFunctionObservableParametersUnion<TFactory>>) => {
    if (argObservable === void 0) {
      throw new Error(`Expected an observable`);
    } else {
      privates.argumentsObserverCount++;
      FunctionObservableSetObservableValue<TFactory>(instance, argObservable, value);
      if (privates.argumentsObserverPauseCount === -1) {
        FunctionObservableCallFactory<TFactory>(instance);
      }
    }
  }).observe(...Array.from(new Set(privates.args))); // ensure we observe it only once

  privates.argumentsObserverCount = 0;
  privates.argumentsObserverPauseCount = -1;
}

export function IsFunctionObservable(value: any): value is IFunctionObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(DISTINCT_VALUE_OBSERVABLE_PRIVATE as symbol);
}

const IS_FUNCTION_OBSERVABLE_CONSTRUCTOR = Symbol('is-function-observable-constructor');

export function IsFunctionObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_FUNCTION_OBSERVABLE_CONSTRUCTOR, direct);
}

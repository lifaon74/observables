import { IAsyncFunctionObservable } from './interfaces';
import { IsObject } from '../../../../helpers';
import {
  ASYNC_FUNCTION_OBSERVABLE_PRIVATE, IAsyncFunctionObservableInternal, IAsyncFunctionObservablePrivate
} from './privates';
import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryParameters, TAsyncFunctionObservableParameters,
  TAsyncFunctionObservableParametersUnion, TAsyncFunctionObservableValue
} from './types';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';
import { Observer } from '../../../../core/observer/implementation';
import { IObservable } from '../../../../core/observable/interfaces';
import { AbortReason } from '../../../../misc/reason/built-in/abort-reason';
import { AsyncFunctionObservableCallFactory, AsyncFunctionObservableSetObservableValue } from './functions';
import { ReadonlyTuple } from '../../../../misc/readonly-tuple/implementation';
import { ConstructClassWithPrivateMembers, HasFactoryWaterMark } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructAsyncFunctionObservable<TFactory extends TAsyncFunctionObservableFactory>(
  instance: IAsyncFunctionObservable<TFactory>,
  context: IAsyncDistinctValueObservableContext<TAsyncFunctionObservableValue<TFactory>>,
  factory: TFactory,
  args: TAsyncFunctionObservableParameters<TFactory>
): void {
  ConstructClassWithPrivateMembers(instance, ASYNC_FUNCTION_OBSERVABLE_PRIVATE);
  const privates: IAsyncFunctionObservablePrivate<TFactory> = (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.factory = factory;
  privates.args = Array.from(args) as TAsyncFunctionObservableParameters<TFactory>;
  privates.readonlyArguments = new ReadonlyTuple<TAsyncFunctionObservableParameters<TFactory>>(
    privates.args
  );

  privates.values = Array.from({ length: privates.args.length }, () => void 0) as TAsyncFunctionObservableFactoryParameters<TFactory>;

  privates.argumentsObserver = new Observer<TAsyncFunctionObservableParametersUnion<TFactory>>((value: TAsyncFunctionObservableParametersUnion<TFactory>, argObservable?: IObservable<TAsyncFunctionObservableParametersUnion<TFactory>>) => {
    if (argObservable === void 0) {
      throw new Error(`Expected an observable`);
    } else {
      AsyncFunctionObservableSetObservableValue<TFactory>(instance, argObservable, value);
      if (privates.argumentsObserverPauseCount === -1) {
        AsyncFunctionObservableCallFactory<TFactory>(instance)
          .catch(AbortReason.discard);
      }
    }
  }).observe(...Array.from(new Set(privates.args))); // ensure we observe it only once

  privates.argumentsObserverCount = 0;
  privates.argumentsObserverPauseCount = -1;
}

export function IsAsyncFunctionObservable(value: any): value is IAsyncFunctionObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_FUNCTION_OBSERVABLE_PRIVATE as symbol);
}

const IS_ASYNC_FUNCTION_OBSERVABLE_CONSTRUCTOR = Symbol('is-async-function-observable-constructor');

export function IsAsyncFunctionObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_ASYNC_FUNCTION_OBSERVABLE_CONSTRUCTOR, direct);
}

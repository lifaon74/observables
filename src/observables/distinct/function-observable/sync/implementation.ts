import { DistinctValueObservable } from '../../distinct-value-observable/sync/implementation';
import { IFunctionObservable, IFunctionObservableConstructor } from './interfaces';
import { ObservableIsFreshlyObserved, ObservableIsNotObserved } from '../../../../core/observable/functions';
import { IDistinctValueObservableContext } from '../../distinct-value-observable/sync/context/interfaces';
import {
  TFunctionObservableFactory, TFunctionObservableParameters, TFunctionObservableRunCallback, TFunctionObservableValue
} from './types';
import { FUNCTION_OBSERVABLE_PRIVATE, IFunctionObservableInternal, IFunctionObservablePrivate } from './privates';
import { ConstructFunctionObservable } from './constructor';
import { FunctionObservableCallFactory } from './functions';
import { IReadonlyTuple } from '../../../../misc/readonly-tuple/interfaces';

/** CONSTRUCTOR FUNCTIONS **/

export function FunctionObservableOnObserved<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): void {
  if (ObservableIsFreshlyObserved<TFunctionObservableValue<TFactory>>(instance)) {
    (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.activate();
  }
}

export function FunctionObservableOnUnobserved<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): void {
  if (ObservableIsNotObserved<TFunctionObservableValue<TFactory>>(instance)) {
    (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.deactivate();
  }
}


/** METHODS **/

/* GETTERS/SETTERS */

export function FunctionObservableGetFactory<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): TFactory {
  return (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE].factory;
}

export function FunctionObservableGetArguments<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): IReadonlyTuple<TFunctionObservableParameters<TFactory>> {
  return (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
}

/* METHODS */

export function FunctionObservablePause<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): void {
  const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
  privates.argumentsObserverPauseCount = privates.argumentsObserverCount;
}

export function FunctionObservableResume<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): void {
  const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
  if (privates.argumentsObserverCount !== privates.argumentsObserverPauseCount) {
    FunctionObservableCallFactory<TFactory>(instance);
  }
  privates.argumentsObserverPauseCount = -1;
}

export function FunctionObservableRun<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>, callback: TFunctionObservableRunCallback<TFactory>): void {
  FunctionObservablePause<TFactory>(instance);
  try {
    callback.call(instance);
  } finally {
    FunctionObservableResume<TFactory>(instance);
  }
}

// export function SourceFunctionObservableCall<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>, args: TFunctionObservableFactoryParameters<TFactory>): void {
//   const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
//   const length: number = privates.args.length;
//
//   for (let i = 0; i < length; i++) {
//     if (!IsSource(privates.args[i])) {
//       throw new TypeError(`Expected Source at FunctionObservable[${ i }]`);
//     }
//   }
//
//   privates.enableArgumentsObserver = false;
//   for (let i = 0; i < length; i++) {
//     (privates.args[i] as unknown as ISource<any>).emit(args[i]);
//     (privates.values as any[])[i] = args[i];
//   }
//   privates.enableArgumentsObserver = true;
//
//   FunctionObservableCallFactory<TFactory>(instance);
// }


/* STATIC */

export function FunctionObservableStaticCreate<TFactory extends TFunctionObservableFactory>(
  _constructor: IFunctionObservableConstructor,
  factory: TFactory,
): (...args: TFunctionObservableParameters<TFactory>) => IFunctionObservable<TFactory> {
  return (...args: TFunctionObservableParameters<TFactory>) => {
    return new _constructor<TFactory>(factory, args);
  };
}


/** CLASS **/

export class FunctionObservable<TFactory extends TFunctionObservableFactory> extends DistinctValueObservable<TFunctionObservableValue<TFactory>> implements IFunctionObservable<TFactory> {

  static create<TFactory extends TFunctionObservableFactory>(factory: TFactory): (...args: TFunctionObservableParameters<TFactory>) => IFunctionObservable<TFactory> {
    return FunctionObservableStaticCreate<TFactory>(this, factory);
  }

  constructor(factory: TFactory, args: TFunctionObservableParameters<TFactory>) {
    let context: IDistinctValueObservableContext<TFunctionObservableValue<TFactory>>;
    super((_context: IDistinctValueObservableContext<TFunctionObservableValue<TFactory>>) => {
      context = _context;
      return {
        onObserved: (): void => {
          FunctionObservableOnObserved<TFactory>(this);
        },
        onUnobserved: (): void => {
          FunctionObservableOnUnobserved<TFactory>(this);
        },
      };
    });
    // @ts-ignore
    ConstructFunctionObservable<TFactory>(this, context, factory, args);
  }

  get factory(): TFactory {
    return FunctionObservableGetFactory<TFactory>(this);
  }

  get args(): IReadonlyTuple<TFunctionObservableParameters<TFactory>> {
    return FunctionObservableGetArguments<TFactory>(this);
  }

  pause(): void {
    FunctionObservablePause<TFactory>(this);
  }

  resume(): void {
    FunctionObservableResume<TFactory>(this);
  }

  run(callback: TFunctionObservableRunCallback<TFactory>): this {
    FunctionObservableRun<TFactory>(this, callback);
    return this;
  }
}



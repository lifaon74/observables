
import { IObservable } from '../../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { VALUE_OBSERVABLE_PRIVATE, DistinctValueObservable } from '../distinct-value-observable/implementation';
import {
  IFunctionObservable, TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters,
  TFunctionObservableParametersUnion, TFunctionObservableValue
} from './interfaces';
import { IReadonlyTuple } from '../../../misc/readonly-list/interfaces';
import { ReadonlyTuple } from '../../../misc/readonly-list/implementation';
import { IObserver } from '../../../core/observer/interfaces';
import { Observer } from '../../../core/observer/public';
import { IDistinctValueObservableContext } from '../distinct-value-observable/interfaces';
import { IsObject } from '../../../helpers';
import { HasFactoryWaterMark } from '../../../classes/class-helpers/factory';
import { IObservableInternal } from '../../../core/observable/privates';
import { ObservableIsFreshlyObserved, ObservableIsNotObserved } from '../../../core/observable/functions';


export const FUNCTION_OBSERVABLE_PRIVATE = Symbol('function-observable-private');

export interface IFunctionObservablePrivate<T extends TFunctionObservableFactory> {
  context: IDistinctValueObservableContext<TFunctionObservableValue<T>>;
  factory: T;
  args: TFunctionObservableParameters<T>;
  readonlyArguments: IReadonlyTuple<TFunctionObservableParameters<T>>;
  argumentsObserver: IObserver<TFunctionObservableParametersUnion<T>>;
  argumentsObserverCount: number;
  argumentsObserverPauseCount: number;
  values: TFunctionObservableFactoryParameters<T>;
}

export interface IFunctionObservableInternal<T extends TFunctionObservableFactory> extends IFunctionObservable<T>, IObservableInternal<TFunctionObservableValue<T>> {
  [FUNCTION_OBSERVABLE_PRIVATE]: IFunctionObservablePrivate<T>;
}


export function ConstructFunctionObservable<T extends TFunctionObservableFactory>(
  observable: IFunctionObservable<T>,
  context: IDistinctValueObservableContext<TFunctionObservableValue<T>>,
  factory: T,
  args: TFunctionObservableParameters<T>
): void {
  ConstructClassWithPrivateMembers(observable, FUNCTION_OBSERVABLE_PRIVATE);
  const privates: IFunctionObservablePrivate<T> = (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.factory = factory;
  privates.args = Array.from(args) as TFunctionObservableParameters<T>;
  privates.readonlyArguments = new ReadonlyTuple<TFunctionObservableParameters<T>>(
    privates.args
  );

  privates.values = Array.from({ length: privates.args.length }, () => void 0) as TFunctionObservableFactoryParameters<T>;

  privates.argumentsObserver = new Observer<TFunctionObservableParametersUnion<T>>((value: TFunctionObservableParametersUnion<T>, argObservable?: IObservable<TFunctionObservableParametersUnion<T>>) => {
    if (argObservable === void 0) {
      throw new Error(`Expected an observable`);
    } else {
      privates.argumentsObserverCount++;
      FunctionObservableSetObservableValue<T>(observable, argObservable, value);
      if (privates.argumentsObserverPauseCount === -1) {
        FunctionObservableCallFactory<T>(observable);
      }
    }
  }).observe(...Array.from(new Set(privates.args))); // ensure we observe it only once

  privates.argumentsObserverCount = 0;
  privates.argumentsObserverPauseCount = -1;
}

export function IsFunctionObservable(value: any): value is IFunctionObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(VALUE_OBSERVABLE_PRIVATE);
}

const IS_FUNCTION_OBSERVABLE_CONSTRUCTOR = Symbol('is-function-observable-constructor');

export function IsFunctionObservableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function') && ((value === FunctionObservable) || HasFactoryWaterMark(value, IS_FUNCTION_OBSERVABLE_CONSTRUCTOR, direct));
}

export function FunctionObservableOnObserved<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  if (ObservableIsFreshlyObserved<TFunctionObservableValue<T>>(observable)) {
    (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.activate();
  }
}

export function FunctionObservableOnUnobserved<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  if (ObservableIsNotObserved<TFunctionObservableValue<T>>(observable)) {
    (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.deactivate();
  }
}

export function FunctionObservableSetObservableValue<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>, argObservable: IObservable<TFunctionObservableParametersUnion<T>>, value: TFunctionObservableParametersUnion<T>): void {
  let index: number = -1;
  while ((index = (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].args.indexOf(argObservable as any, index + 1)) !== -1) {
    ((observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].values as any[])[index] = value;
  }
}

export function FunctionObservableCallFactory<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].context.emit(
    (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].factory.apply(
      null,
      (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].values
    )
  );
}


export function FunctionObservablePause<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount = ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverCount;
}

export function FunctionObservableResume<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  if (((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverCount !== ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount) {
    FunctionObservableCallFactory<T>(observable);
  }
  ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].argumentsObserverPauseCount = -1;
}


export function FunctionObservableRun<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>, callback: () => void): void {
  FunctionObservablePause<T>(observable);
  try {
    callback.call(observable);
  } finally {
    FunctionObservableResume<T>(observable);
  }
}


// export function SourceFunctionObservableCall<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>, args: TFunctionObservableFactoryParameters<T>): void {
//   const privates: IFunctionObservablePrivate<T> = ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];
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
//   FunctionObservableCallFactory<T>(observable);
// }


export class FunctionObservable<T extends TFunctionObservableFactory> extends DistinctValueObservable<TFunctionObservableValue<T>> implements IFunctionObservable<T> {

  static create<T extends TFunctionObservableFactory>(factory: T): (...args: TFunctionObservableParameters<T>) => IFunctionObservable<T> {
    return (...args: TFunctionObservableParameters<T>) => {
      return new FunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TFunctionObservableParameters<T>) {
    let context: IDistinctValueObservableContext<TFunctionObservableValue<T>>;
    super((_context: IDistinctValueObservableContext<TFunctionObservableValue<T>>) => {
      context = _context;
      return {
        onObserved: (): void => {
          FunctionObservableOnObserved<T>(this);
        },
        onUnobserved: (): void => {
          FunctionObservableOnUnobserved<T>(this);
        },
      };
    });
    // @ts-ignore
    ConstructFunctionObservable<T>(this, context, factory, args);
  }

  get factory(): T {
    return ((this as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].factory;
  }

  get args(): IReadonlyTuple<TFunctionObservableParameters<T>> {
    return ((this as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
  }

  pause(): void {
    FunctionObservablePause<T>(this);
  }

  resume(): void {
    FunctionObservableResume<T>(this);
  }

  run(callback: (this: this) => void): this {
    FunctionObservableRun<T>(this, callback);
    return this;
  }
}



import {
  IObservableInternal,
  ObservableIsFreshlyObserved, ObservableIsNotObserved,
} from '../../../core/observable/implementation';
import { IObservable } from '../../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { ValueObservable } from '../value-observable/implementation';
import {
  IFunctionObservable, TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters,
  TFunctionObservableParametersUnion, TFunctionObservableValue
} from './interfaces';
import { IReadonlyTuple } from '../../../misc/readonly-list/interfaces';
import { ReadonlyTuple } from '../../../misc/readonly-list/implementation';
import { IObserver } from '../../../core/observer/interfaces';
import { Observer } from '../../../core/observer/public';
import { IValueObservableContext } from '../value-observable/interfaces';
import { IsSource } from '../source/implementation';
import { ISource } from '../source/interfaces';


export const FUNCTION_OBSERVABLE_PRIVATE = Symbol('function-observable-private');

export interface IFunctionObservablePrivate<T extends TFunctionObservableFactory> {
  context: IValueObservableContext<TFunctionObservableValue<T>>;
  factory: T;
  arguments: TFunctionObservableParameters<T>;
  readonlyArguments: IReadonlyTuple<TFunctionObservableParameters<T>>;
  argumentsObserver: IObserver<TFunctionObservableParametersUnion<T>>;
  values: TFunctionObservableFactoryParameters<T>;
  enableArgumentsObserver: boolean;
}

export interface IFunctionObservableInternal<T extends TFunctionObservableFactory> extends IFunctionObservable<T>, IObservableInternal<TFunctionObservableValue<T>> {
  [FUNCTION_OBSERVABLE_PRIVATE]: IFunctionObservablePrivate<T>;
}


export function ConstructFunctionObservable<T extends TFunctionObservableFactory>(
  observable: IFunctionObservable<T>,
  context: IValueObservableContext<TFunctionObservableValue<T>>,
  factory: T,
  args: TFunctionObservableParameters<T>
): void {
  ConstructClassWithPrivateMembers(observable, FUNCTION_OBSERVABLE_PRIVATE);
  const privates: IFunctionObservablePrivate<T> = (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.factory = factory;
  privates.arguments = Array.from(args) as TFunctionObservableParameters<T>;
  privates.readonlyArguments = new ReadonlyTuple<TFunctionObservableParameters<T>>(
    privates.arguments
  );

  privates.values = Array.from({ length: privates.arguments.length }, () => void 0) as TFunctionObservableFactoryParameters<T>;

  privates.argumentsObserver = new Observer<TFunctionObservableParametersUnion<T>>((value: TFunctionObservableParametersUnion<T>, argObservable: IObservable<TFunctionObservableParametersUnion<T>>) => {
    FunctionObservableSetObservableValue<T>(observable, argObservable, value);
    if (privates.enableArgumentsObserver) {
      FunctionObservableCallFactory<T>(observable);
    }
  }).observe(...Array.from(new Set(privates.arguments))); // ensure we observe it only once

  privates.enableArgumentsObserver = true;
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
  while ((index = (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].arguments.indexOf(argObservable as any, index + 1)) !== -1) {
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


export function FunctionObservableRun<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>, callback: () => void): void {
  const privates: IFunctionObservablePrivate<T> = ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];

  privates.enableArgumentsObserver = false;
  try {
    callback.call(observable);
  } finally {
    privates.enableArgumentsObserver = true;
  }

  FunctionObservableCallFactory<T>(observable);
}


export function SourceFunctionObservableCall<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>, args: TFunctionObservableFactoryParameters<T>): void {
  const privates: IFunctionObservablePrivate<T> = ((observable as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];
  const length: number = privates.arguments.length;

  for (let i = 0; i < length; i++) {
    if (!IsSource(privates.arguments[i])) {
      throw new TypeError(`Expected Source at FunctionObservable[${ i }]`);
    }
  }

  privates.enableArgumentsObserver = false;
  for (let i = 0; i < length; i++) {
    (privates.arguments[i] as unknown as ISource<any>).emit(args[i]);
    (privates.values as any[])[i] = args[i];
  }
  privates.enableArgumentsObserver = true;

  FunctionObservableCallFactory<T>(observable);
}

// INFO think about a pause/resume instead of a run


export class FunctionObservable<T extends TFunctionObservableFactory> extends ValueObservable<TFunctionObservableValue<T>> implements IFunctionObservable<T> {

  static create<T extends TFunctionObservableFactory>(factory: T): (...args: TFunctionObservableParameters<T>) => IFunctionObservable<T> {
    return (...args: TFunctionObservableParameters<T>) => {
      return new FunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TFunctionObservableParameters<T>) {
    let context: IValueObservableContext<TFunctionObservableValue<T>> = void 0;
    super((_context: IValueObservableContext<TFunctionObservableValue<T>>) => {
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
    ConstructFunctionObservable<T>(this, context, factory, args);
  }

  get factory(): T {
    return ((this as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].factory;
  }

  get arguments(): IReadonlyTuple<TFunctionObservableParameters<T>> {
    return ((this as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
  }

  run(callback: (this: this) => void): this {
    FunctionObservableRun<T>(this, callback);
    return this;
  }
}



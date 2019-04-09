import {
  IObservableInternal,
  ObservableIsFreshlyObserved, ObservableIsNotObserved,
} from '../../core/observable/implementation';
import { IObservable } from '../../core/observable/interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { ValueObservable } from '../value-observable/implementation';
import { IFunctionObservable, ISourceFunctionObservable, TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters, TFunctionObservableParametersUnion, TFunctionObservableValue, TSourceFunctionObservableParameters } from './interfaces';
import { IReadonlyTuple } from '../../misc/readonly-list/interfaces';
import { ReadonlyTuple } from '../../misc/readonly-list/implementation';
import { IObserver } from '../../core/observer/interfaces';
import { Observer } from '../../core/observer/public';
import { IValueObservableContext } from '../value-observable/interfaces';


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

  privates.values = Array.from({ length: privates.arguments.length }, () => void 0) as TFunctionObservableFactoryParameters<T> ;

  privates.argumentsObserver = new Observer<TFunctionObservableParametersUnion<T>>((value: TFunctionObservableParametersUnion<T>, _observable: IObservable<TFunctionObservableParametersUnion<T>>) => {
    if (privates.enableArgumentsObserver) {
      let index: number = -1;
      while ((index = privates.arguments.indexOf(_observable as any, index + 1)) !== -1) {
        privates.values[index] = value;
      }
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


export function FunctionObservableCallFactory<T extends TFunctionObservableFactory>(observable: IFunctionObservable<T>): void {
  (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].context.emit(
    (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].factory.apply(
      null,
      (observable as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].values
    )
  );
}



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

}


/*------------------------------*/

export interface ISourceFunctionObservablePrivate<T extends TFunctionObservableFactory> extends IFunctionObservablePrivate<T> {
  arguments: TSourceFunctionObservableParameters<T>;
  readonlyArguments: IReadonlyTuple<TSourceFunctionObservableParameters<T>>;
}

export interface ISourceFunctionObservableInternal<T extends TFunctionObservableFactory> extends IFunctionObservableInternal<T> {
  [FUNCTION_OBSERVABLE_PRIVATE]: ISourceFunctionObservablePrivate<T>;
}

export function SourceFunctionObservableCall<T extends TFunctionObservableFactory>(observable: ISourceFunctionObservable<T>, args: TFunctionObservableFactoryParameters<T>): void {
  const privates: ISourceFunctionObservablePrivate<T> = ((observable as unknown) as ISourceFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE];

  privates.enableArgumentsObserver = false;
  for (let i = 0, l = privates.arguments.length; i < l ; i++) {
    privates.arguments[i].emit(args[i]);
    privates.values[i] = args[i];
  }
  privates.enableArgumentsObserver = true;

  FunctionObservableCallFactory<T>(observable);
}


export class SourceFunctionObservable<T extends TFunctionObservableFactory> extends FunctionObservable<T> implements ISourceFunctionObservable<T> {
  static create<T extends TFunctionObservableFactory>(factory: T): (...args: TSourceFunctionObservableParameters<T>) => ISourceFunctionObservable<T> {
    return (...args: TSourceFunctionObservableParameters<T>) => {
      return new SourceFunctionObservable<T>(factory, args);
    };
  }

  constructor(factory: T, args: TSourceFunctionObservableParameters<T>) {
    super(factory, args);
  }

  get arguments(): IReadonlyTuple<TSourceFunctionObservableParameters<T>> {
    return ((this as unknown) as IFunctionObservableInternal<T>)[FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments as IReadonlyTuple<TSourceFunctionObservableParameters<T>>;
  }

  call(...args: TFunctionObservableFactoryParameters<T>): this {
    SourceFunctionObservableCall<T>(this, args);
    return this;
  }
}




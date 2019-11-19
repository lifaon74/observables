import { IAsyncFunctionObservable } from './interfaces';
import { IReadonlyTuple } from '../../../../misc/readonly-list/interfaces';
import { AsyncDistinctValueObservable } from '../../distinct-value-observable/async/implementation';
import { ObservableIsFreshlyObserved, ObservableIsNotObserved } from '../../../../core/observable/functions';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';
import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableParameters, TAsyncFunctionObservableRunCallback,
  TAsyncFunctionObservableValue
} from './types';
import {
  ASYNC_FUNCTION_OBSERVABLE_PRIVATE, IAsyncFunctionObservableInternal, IAsyncFunctionObservablePrivate
} from './privates';
import { ConstructAsyncFunctionObservable } from './constructor';
import { AsyncFunctionObservableCallFactory } from './functions';

/** CONSTRUCTOR FUNCTIONS **/

export function AsyncFunctionObservableOnObserved<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): void {
  if (ObservableIsFreshlyObserved<TAsyncFunctionObservableValue<TFactory>>(instance)) {
    (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.activate();
  }
}

export function AsyncFunctionObservableOnUnobserved<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): void {
  if (ObservableIsNotObserved<TAsyncFunctionObservableValue<TFactory>>(instance)) {
    (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].argumentsObserver.deactivate();
  }
}

/** METHODS **/

/* GETTERS/SETTERS */

export function AsyncFunctionObservableGetFactory<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): TFactory {
  return (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].factory;
}

export function AsyncFunctionObservableGetArguments<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): IReadonlyTuple<TAsyncFunctionObservableParameters<TFactory>> {
  return (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE].readonlyArguments;
}

/* METHODS */

export function AsyncFunctionObservablePause<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): void {
  const privates: IAsyncFunctionObservablePrivate<TFactory> = (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];
  privates.argumentsObserverPauseCount = privates.argumentsObserverCount;
}

export function AsyncFunctionObservableResume<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>): Promise<void> {
  const privates: IAsyncFunctionObservablePrivate<TFactory> = (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];
  const argumentsObserverPauseCount: number = privates.argumentsObserverPauseCount;
  privates.argumentsObserverPauseCount = -1;
  if (privates.argumentsObserverCount === argumentsObserverPauseCount) {
    return Promise.resolve();
  } else {
    return AsyncFunctionObservableCallFactory<TFactory>(instance);
  }
}


export function AsyncFunctionObservableRun<TFactory extends TAsyncFunctionObservableFactory>(instance: IAsyncFunctionObservable<TFactory>, callback: TAsyncFunctionObservableRunCallback<TFactory>): Promise<void> {
  AsyncFunctionObservablePause<TFactory>(instance);
  return new Promise<void>((resolve: any) => {
    resolve(callback.call(instance));
  })
    .finally(() => {
      return AsyncFunctionObservableResume<TFactory>(instance);
    });
}


/* STATIC */

/** CLASS **/

export class AsyncFunctionObservable<TFactory extends TAsyncFunctionObservableFactory> extends AsyncDistinctValueObservable<TAsyncFunctionObservableValue<TFactory>> implements IAsyncFunctionObservable<TFactory> {

  static create<TFactory extends TAsyncFunctionObservableFactory>(factory: TFactory): (...args: TAsyncFunctionObservableParameters<TFactory>) => IAsyncFunctionObservable<TFactory> {
    return (...args: TAsyncFunctionObservableParameters<TFactory>) => {
      return new AsyncFunctionObservable<TFactory>(factory, args);
    };
  }

  constructor(factory: TFactory, args: TAsyncFunctionObservableParameters<TFactory>) {
    let context: IAsyncDistinctValueObservableContext<TAsyncFunctionObservableValue<TFactory>>;
    super((_context: IAsyncDistinctValueObservableContext<TAsyncFunctionObservableValue<TFactory>>) => {
      context = _context;
      return {
        onObserved: (): void => {
          AsyncFunctionObservableOnObserved<TFactory>(this);
        },
        onUnobserved: (): void => {
          AsyncFunctionObservableOnUnobserved<TFactory>(this);
        },
      };
    });
    // @ts-ignore
    ConstructAsyncFunctionObservable<TFactory>(this, context, factory, args);
  }

  get factory(): TFactory {
    return AsyncFunctionObservableGetFactory<TFactory>(this);
  }

  get args(): IReadonlyTuple<TAsyncFunctionObservableParameters<TFactory>> {
    return AsyncFunctionObservableGetArguments<TFactory>(this);
  }

  pause(): void {
    AsyncFunctionObservablePause<TFactory>(this);
  }

  resume(): Promise<void> {
    return AsyncFunctionObservableResume<TFactory>(this);
  }

  run(callback: TAsyncFunctionObservableRunCallback<TFactory>): Promise<this> {
    return AsyncFunctionObservableRun<TFactory>(this, callback)
      .then(() => this);
  }

}




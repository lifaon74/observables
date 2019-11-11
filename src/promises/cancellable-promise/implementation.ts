import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { TCastableToIteratorStrict, ToIterator } from '../../helpers';
import {
  TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion, TPromiseOrValueTupleToValueTuple,
  TPromiseOrValueTupleToValueUnion
} from '../interfaces';
import { PromiseTry } from '../helpers';
import { Reason } from '../../misc/reason/implementation';
import { RunConcurrentPromises } from '../concurent-promises/helpers';
import {
  ICancellablePromiseOptions, TCancellablePromiseCancelledReturn, TCancellablePromiseCatchReturn,
  TCancellablePromiseCreateCallback, TCancellablePromiseFactory, TCancellablePromiseOnCancelledArgument,
  TCancellablePromiseOnFinallyArgument, TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejectedArgument,
  TCancellablePromiseThenReturn, TCancellablePromiseTryCallback
} from './types';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal } from './privates';
import { ConstructCancellablePromise, IsCancellablePromise } from './constructor';
import { TAbortStrategy, TAbortStrategyReturn } from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import {
  AbortControllerWhenPromiseResolved, CancellablePromiseOptimizedFinally, CancellablePromiseOptimizedThen,
  CancellablePromiseRunFactories
} from './functions';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';


/** METHODS **/

/* METHODS */

export function CancellablePromiseThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled?: TFulfilled,
  onRejected?: TRejected,
  onCancelled?: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  return CancellablePromiseOptimizedThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled as TFulfilled, onRejected as TRejected, onCancelled as TCancelled);
}

export function CancellablePromiseCatch<T, TStrategy extends TAbortStrategy, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onRejected?: TRejected,
): TCancellablePromiseCatchReturn<T, TStrategy, TRejected> {
  return CancellablePromiseThen<T, TStrategy, undefined, TRejected, undefined>(instance, void 0, onRejected as TRejected, void 0) as TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;
}

export function CancellablePromiseCancelled<T, TStrategy extends TAbortStrategy, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onCancelled?: TCancelled
): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled> {
  return CancellablePromiseThen<T, TStrategy, undefined, undefined, TCancelled>(instance, void 0, void 0, onCancelled as TCancelled) as TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;
}

export function CancellablePromiseFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  return CancellablePromiseOptimizedFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

/*-------------------------------------------------------------------------------------------------------------------------------------------------------*/

/* STATIC METHODS */

/**
 * Creates and returns a new CancellablePromise if 'promiseOrCallback' is not a CancellablePromise with the same signal,
 * else returns 'promiseOrCallback'
 */
export function CancellablePromiseOf<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  return (
    IsCancellablePromise(promiseOrCallback)
    && (promiseOrCallback.signal === signal)
  )
    ? promiseOrCallback
    : new constructor(promiseOrCallback, signal, options);
}

/**
 * Returns a new CancellablePromise resolved with the value returned by the execution of 'callback' (rejects if throws)
 */
export function CancellablePromiseTry<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  callback: TCancellablePromiseTryCallback<T, TStrategy>,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<T, TStrategy>
): ICancellablePromise<T, TStrategy> {
  return new constructor(function (resolve: any, reject: any, signal: IAdvancedAbortSignal) {
    resolve(callback.call(this, signal));
  }, signal, options);
}


/**
 * Returns a new CancellablePromise resolved when one of the parallel executions for each 'factories' resolves (fulfilled or rejected).
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is resolved (fulfilled or rejected)
 */
export function CancellablePromiseRace<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.race<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, controller.signal, options)
      ),
      controller,
      () => new Reason(`One of the racing promises is resolved`, 'RACE_CALLBACK_RESOLVED'),
    );
  }, signal, options);
}


/**
 * Returns a new CancellablePromise resolved when every 'values' is resolved or if one values is rejected
 *  - every factory receives a shared <signal>.
 *    - this <signal> is aborted if 'signal' is aborted, OR when the returned CancellablePromise is rejected
 */
export function CancellablePromiseAll<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
  return CancellablePromiseTry<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    const controller: IAdvancedAbortController = AdvancedAbortController.fromAbortSignals(signal);
    return AbortControllerWhenPromiseResolved(
      Promise.all<TPromiseOrValueFactoryTupleToValueUnion<TTuple>>(
        CancellablePromiseRunFactories<TTuple, TStrategy>(constructor, factories, controller.signal, options)
      ) as Promise<TPromiseOrValueTupleToValueTuple<TTuple>[]>,
      controller,
      () => new Reason(`One of the parallel promises is rejected`, 'ALL_CALLBACK_REJECTED'),
    );
  }, signal, options);
}

/*----*/

let globalConcurrentPromises: ICancellablePromise<void, TAbortStrategy>;

function CancellablePromiseConcurrentGlobalRun(
  run: () => ICancellablePromise<void, TAbortStrategy>,
  global: boolean = false,
): ICancellablePromise<void, TAbortStrategy> {
  if (global) {
    if ((globalConcurrentPromises === void 0) || globalConcurrentPromises.signal.aborted) {
      globalConcurrentPromises = run();
    } else {
      globalConcurrentPromises = globalConcurrentPromises
        .then(run, run, run);
    }
    return globalConcurrentPromises;
  } else {
    return run();
  }
}

export function CancellablePromiseConcurrent<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
  signal: IAdvancedAbortSignal,
  strategy?: TStrategy,
  concurrent?: number,
  global?: boolean,
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseConcurrentGlobalRun(
    () => CancellablePromiseConcurrentNonGlobal<T, TStrategy>(constructor, iterator, signal, strategy, concurrent),
    global
  ) as ICancellablePromise<void, TStrategy>;
}

export function CancellablePromiseConcurrentNonGlobal<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
  signal: IAdvancedAbortSignal,
  strategy?: TStrategy,
  concurrent?: number,
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseTry<void, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    return RunConcurrentPromises<T>(ToIterator<TPromiseOrValue<T>>(iterator), concurrent, signal);
  }, signal, strategy);
}


export function * CancellablePromiseFactoriesIteratorToPromiseIterable<T, TStrategy extends TAbortStrategy>(iterator: Iterator<TCancellablePromiseFactory<T>>, signal: IAdvancedAbortSignal): IterableIterator<Promise<T>> {
  let result: IteratorResult<TCancellablePromiseFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(() => result.value.call(null, signal));
  }
}

export function CancellablePromiseConcurrentFactories<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
  signal: IAdvancedAbortSignal,
  strategy?: TStrategy,
  concurrent?: number,
  global: boolean = false,
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseConcurrentGlobalRun(
    () => CancellablePromiseConcurrentFactoriesNonGlobal<T, TStrategy>(constructor, iterator, signal, strategy, concurrent),
    global
  ) as ICancellablePromise<void, TStrategy>;
}

export function CancellablePromiseConcurrentFactoriesNonGlobal<T, TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
  signal: IAdvancedAbortSignal,
  strategy?: TStrategy,
  concurrent?: number,
): ICancellablePromise<void, TStrategy> {
  return CancellablePromiseTry<void, TStrategy>(constructor, function (signal: IAdvancedAbortSignal) {
    return RunConcurrentPromises<T>(
      CancellablePromiseFactoriesIteratorToPromiseIterable<T, TStrategy>(ToIterator<TCancellablePromiseFactory<T>>(iterator), signal),
      concurrent,
      signal
    );
  }, signal, strategy);
}

export function CancellablePromiseFetch<TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  requestInfo: RequestInfo,
  requestInit: RequestInit | undefined,
  signal: IAdvancedAbortSignal,
  strategy?: TStrategy
): ICancellablePromise<Response, TStrategy> {
  return new constructor<Response, TStrategy>((resolve: any, reject: any, signal: IAdvancedAbortSignal) => {
    resolve(fetch(...signal.wrapFetchArguments(requestInfo, requestInit)));
  }, signal, strategy);
}


export class CancellablePromise<T, TStrategy extends TAbortStrategy = 'never'> implements ICancellablePromise<T, TStrategy> {

  // static resolve(): ICancellablePromise<void, 'never'>;
  // static resolve<TStrategy extends TAbortStrategy>(): ICancellablePromise<void, TStrategy>;
  // static resolve<T>(
  //   value: TPromiseOrValue<T>,
  //   signal?: IAdvancedAbortSignal
  // ): ICancellablePromise<T, 'never'>;
  // static resolve<T, TStrategy extends TAbortStrategy>(
  //   value: TPromiseOrValue<T>,
  //   signal: IAdvancedAbortSignal | undefined,
  //   strategy: TStrategy
  // ): ICancellablePromise<T, TStrategy>;
  // static resolve<T, TStrategy extends TAbortStrategy>(
  //   value?: TPromiseOrValue<T>,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<T, TStrategy> {
  //   return new CancellablePromise<T, TStrategy>(Promise.resolve<T>(value as T), signal, strategy);
  // }
  //
  // static reject(): ICancellablePromise<never, 'never'>;
  // static reject(
  //   reason: any,
  //   signal?: IAdvancedAbortSignal
  // ): ICancellablePromise<never, 'never'>;
  // static reject<TStrategy extends TAbortStrategy>(
  //   reason: any,
  //   signal: IAdvancedAbortSignal | undefined,
  //   strategy: TStrategy
  // ): ICancellablePromise<never, TStrategy>;
  // static reject<T, TStrategy extends TAbortStrategy>(
  //   reason?: any,
  //   signal?: IAdvancedAbortSignal,
  //   strategy?: TStrategy
  // ): ICancellablePromise<T, TStrategy> {
  //   return new CancellablePromise<T, TStrategy>(Promise.reject<T>(reason), signal, strategy);
  // }


  static try<T>(
    callback: TCancellablePromiseTryCallback<T, 'never'>,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<T, 'never'>;
  static try<T, TStrategy extends TAbortStrategy>(
    callback: TCancellablePromiseTryCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<T, TStrategy>
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseTry<T, TStrategy>(this, callback, signal, options);
  }


  static race<TTuple extends TCancellablePromiseFactory<any>[]>(
    factories: TTuple,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, 'never'>;
  static race<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
    factories: TTuple,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
  ): ICancellablePromise<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy> {
    return CancellablePromiseRace<TTuple, TStrategy>(this, factories, signal, options);
  }


  static all<TTuple extends TPromiseOrValue<any>[]>(
    values: TTuple,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, 'never'>;
  static all<TTuple extends TPromiseOrValue<any>[], TStrategy extends TAbortStrategy>(
    values: TTuple,
    signal: IAdvancedAbortSignal,
    options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
  ): ICancellablePromise<TPromiseOrValueTupleToValueTuple<TTuple>, TStrategy> {
    return CancellablePromiseAll<TTuple, TStrategy>(this, values, signal, options);
  }


  static concurrent<T>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    global?: boolean,
    signal?: IAdvancedAbortSignal,
  ): ICancellablePromise<void, 'never'>;
  static concurrent<T, TStrategy extends TAbortStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent: number | undefined,
    global: boolean | undefined,
    signal: IAdvancedAbortSignal | undefined,
    strategy: TStrategy
  ): ICancellablePromise<void, TStrategy>;
  static concurrent<T, TStrategy extends TAbortStrategy>(
    iterator: TCastableToIteratorStrict<TPromiseOrValue<T>>,
    concurrent?: number,
    global?: boolean,
    signal?: IAdvancedAbortSignal,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrent<T, TStrategy>(this, iterator, concurrent, global, signal, strategy);
  }

  static concurrentFactories<T>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent?: number,
    global?: boolean,
    signal?: IAdvancedAbortSignal,
  ): ICancellablePromise<void, 'never'>;
  static concurrentFactories<T, TStrategy extends TAbortStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent: number | undefined,
    global: boolean | undefined,
    signal: IAdvancedAbortSignal | undefined,
    strategy: TStrategy
  ): ICancellablePromise<void, TStrategy>;
  static concurrentFactories<T, TStrategy extends TAbortStrategy>(
    iterator: TCastableToIteratorStrict<TCancellablePromiseFactory<T>>,
    concurrent?: number,
    global?: boolean,
    signal?: IAdvancedAbortSignal,
    strategy?: TStrategy
  ): ICancellablePromise<void, TStrategy> {
    return CancellablePromiseConcurrentFactories<T, TStrategy>(this, iterator, concurrent, global, signal, strategy);
  }

  static fetch(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<Response, 'never'>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
    strategy: TStrategy
  ): ICancellablePromise<Response, TStrategy>;
  static fetch<TStrategy extends TAbortStrategy>(
    requestInfo: RequestInfo,
    requestInit: RequestInit | undefined,
    signal: IAdvancedAbortSignal,
    strategy?: TStrategy
  ): ICancellablePromise<Response, TStrategy> {
    return CancellablePromiseFetch<TStrategy>(this, requestInfo, requestInit, signal, strategy);
  }


  static of<T>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, 'never'>,
    signal: IAdvancedAbortSignal,
  ): ICancellablePromise<T, 'never'>;
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    strategy: TStrategy
  ): ICancellablePromise<T, TStrategy>;
  static of<T, TStrategy extends TAbortStrategy>(
    promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>,
    signal: IAdvancedAbortSignal,
    strategy?: TStrategy
  ): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseOf<T, TStrategy>(this, promiseOrCallback, signal, strategy);
  }

  constructor(promiseOrCallback: Promise<T> | TCancellablePromiseCreateCallback<T, TStrategy>, signal: IAdvancedAbortSignal, options?: ICancellablePromiseOptions<T, TStrategy>) {
    ConstructCancellablePromise<T, TStrategy>(this, promiseOrCallback, signal, options);
  }

  get promise(): Promise<T | TAbortStrategyReturn<TStrategy>> {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].promise;
  }

  get signal(): IAdvancedAbortSignal {
    return ((this as unknown) as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE].signal;
  }

  get [Symbol.toStringTag](): string {
    return 'CancellablePromise';
  }


  then(): TCancellablePromiseThenReturn<T, TStrategy, undefined, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, undefined, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, undefined>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
    onFulfilled: TFulfilled,
    onRejected: TRejected,
    onCancelled: TCancelled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
  then<TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
    onFulfilled?: TFulfilled,
    onRejected?: TRejected,
    onCancelled?: TCancelled,
  ): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
    return CancellablePromiseThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(this, onFulfilled, onRejected, onCancelled);
  }

  catch(): TCancellablePromiseCatchReturn<T, TStrategy, undefined>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(onRejected: TRejected): TCancellablePromiseCatchReturn<T, TStrategy, TRejected>;
  catch<TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>>(onRejected?: TRejected): TCancellablePromiseCatchReturn<T, TStrategy, TRejected> {
    return CancellablePromiseCatch<T, TStrategy, TRejected>(this, onRejected);
  }

  cancelled(): TCancellablePromiseCancelledReturn<T, TStrategy, undefined>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(onCancelled: TCancelled): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled>;
  cancelled<TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(onCancelled?: TCancelled): TCancellablePromiseCancelledReturn<T, TStrategy, TCancelled> {
    return CancellablePromiseCancelled<T, TStrategy, TCancelled>(this, onCancelled);
  }

  finally(onFinally?: TCancellablePromiseOnFinallyArgument<T, TStrategy>, includeCancelled?: boolean): ICancellablePromise<T, TStrategy> {
    return CancellablePromiseFinally<T, TStrategy>(this, onFinally, includeCancelled);
  }
}




import {
  TAbortStrategy, TAbortStrategyReturn, TAbortStrategyReturnedPromise
} from '../../misc/advanced-abort-controller/advanced-abort-signal/types';
import {
  ICancellablePromiseOptions, PromiseCancelledObject, TCancellablePromiseFactory,
  TCancellablePromiseOnCancelledArgument, TCancellablePromiseOnFinallyArgument, TCancellablePromiseOnFulfilled,
  TCancellablePromiseOnFulfilledArgument, TCancellablePromiseOnRejected, TCancellablePromiseOnRejectedArgument,
  TCancellablePromiseThenReturn
} from './types';
import { ICancellablePromise, ICancellablePromiseConstructor } from './interfaces';
import { CANCELLABLE_PROMISE_PRIVATE, ICancellablePromiseInternal, ICancellablePromisePrivate } from './privates';
import {
  PromiseFulfilledObject, PromiseRejectedObject, TPromise, TPromiseOrValue, TPromiseOrValueFactoryTupleToValueUnion,
  TPromiseOrValueTupleToCancellablePromiseTuple, TPromiseOrValueTupleToValueUnion, TPromiseType
} from '../interfaces';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { Finally, PromiseTry } from '../helpers';
import { NewCancellablePromiseFromInstance } from './constructor';
import { CancellablePromiseThen, CancellablePromiseTry } from './implementation';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../../misc/advanced-abort-controller/interfaces';

/** FUNCTIONS **/

export function CancellablePromiseInternalThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];

  type TPotentiallyCancelledPromiseValue = T | TCancelled | TAbortStrategyReturn<TStrategy>;
  type TPromiseValue = never | TFulfilled | TRejected | TPotentiallyCancelledPromiseValue;

  let newPromise: Promise<TPromiseValue>;
  let newSignal: IAdvancedAbortSignal;
  let onCancelPromise: TAbortStrategyReturnedPromise<T, TStrategy, TCancelled>;

  if (typeof onCancelled === 'function') {
    const abortController: IAdvancedAbortController = new AdvancedAbortController();
    newSignal = abortController.signal;
    onCancelPromise = privates.signal.wrapPromise<T, TStrategy, TCancelled>(
      privates.promise,
      {
        strategy: privates.strategy,
        onAborted: (reason: any, newController: IAdvancedAbortController) => {
          return onCancelled.call(instance, reason, newController, privates.signal);
        },
        onAbortedController: abortController
      }
    );
  } else {
    newSignal = privates.signal;
    onCancelPromise = privates.promise;
  }

  const onFulfilledDefined: boolean = (typeof onFulfilled === 'function');
  const onRejectedDefined: boolean = (typeof onRejected === 'function');

  if (onFulfilledDefined || onRejectedDefined) {
    newPromise = onCancelPromise.then(
      onFulfilledDefined
        ? privates.signal.wrapFunction<(value: TPotentiallyCancelledPromiseValue) => TPromiseOrValue<TFulfilled>, TStrategy, never>((value: TPotentiallyCancelledPromiseValue): TPromiseOrValue<TFulfilled> => {
          return (onFulfilled as TCancellablePromiseOnFulfilled<T, TStrategy, TFulfilled>).call(instance, value, privates.signal) as any;
        }, privates)
        : void 0,
      onRejectedDefined
        ? privates.signal.wrapFunction<(value: T) => TPromiseOrValue<TRejected>, TStrategy, never>((reason: any) => {
          return (onRejected as TCancellablePromiseOnRejected<T, TStrategy, TRejected>).call(instance, reason, privates.signal);
        }, privates)
        : void 0
    );
  } else {
    newPromise = onCancelPromise;
  }

  return NewCancellablePromiseFromInstance<T, TStrategy, TPromiseValue>(instance, newPromise, newSignal) as TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled>;
}

export function CancellablePromiseOptimizedThen<T, TStrategy extends TAbortStrategy, TFulfilled extends TCancellablePromiseOnFulfilledArgument<T, TStrategy, any>, TRejected extends TCancellablePromiseOnRejectedArgument<T, TStrategy, any>, TCancelled extends TCancellablePromiseOnCancelledArgument<T, TStrategy, any>>(
  instance: ICancellablePromise<T, TStrategy>,
  onFulfilled: TFulfilled,
  onRejected: TRejected,
  onCancelled: TCancelled,
): TCancellablePromiseThenReturn<T, TStrategy, TFulfilled, TRejected, TCancelled> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T, TStrategy>).then<TFulfilled, TRejected, TCancelled>(onFulfilled, onRejected, onCancelled)
    : CancellablePromiseInternalThen<T, TStrategy, TFulfilled, TRejected, TCancelled>(instance, onFulfilled, onRejected, onCancelled);
}


export function CancellablePromiseInternalFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled: boolean = false
): ICancellablePromise<T, TStrategy> {
  if (typeof onFinally === 'function') {
    const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
    return CancellablePromiseThen<T, TStrategy, (value: T) => TPromise<T>, (reason: any) => TPromise<never>, ((reason: any, newController: IAdvancedAbortController) => TPromise<never>) | undefined>(
      instance,
      (value: T) => {
        return PromiseTry<void>((): TPromise<void> => {
          return onFinally.call(instance, {
            status: 'fulfilled',
            value: value
          } as PromiseFulfilledObject<T>, privates.signal);
        }).then(() => value);
      }, (reason: any): TPromise<never> => {
        return PromiseTry<void>(() => {
          return onFinally.call(instance, {
            status: 'rejected',
            reason: reason
          } as PromiseRejectedObject, privates.signal);
        }).then(() => {
          throw reason;
        });
      }, includeCancelled
        ? (reason: any, newController: IAdvancedAbortController): TPromise<never> => {
          return PromiseTry<void>(() => {
            return onFinally.call(instance, {
              status: 'cancelled',
              reason: reason
            } as PromiseCancelledObject, privates.signal);
          }).then(() => {
            newController.abort(reason);
          });
        }
        : void 0
    ) as ICancellablePromise<T, TStrategy>;
  } else {
    return CancellablePromiseThen<T, TStrategy, undefined, undefined, undefined>(instance, void 0, void 0, void 0) as ICancellablePromise<T, TStrategy>;
  }
}

export function CancellablePromiseOptimizedFinally<T, TStrategy extends TAbortStrategy>(
  instance: ICancellablePromise<T, TStrategy>,
  onFinally: TCancellablePromiseOnFinallyArgument<T, TStrategy>,
  includeCancelled?: boolean
): ICancellablePromise<T, TStrategy> {
  const privates: ICancellablePromisePrivate<T, TStrategy> = (instance as ICancellablePromiseInternal<T, TStrategy>)[CANCELLABLE_PROMISE_PRIVATE];
  return privates.isCancellablePromiseWithSameSignal
    ? (privates.promise as ICancellablePromise<T, TStrategy>).finally(onFinally, includeCancelled)
    : CancellablePromiseInternalFinally<T, TStrategy>(instance, onFinally, includeCancelled);
}

/**
 * Runs 'factories' in parallel, and wraps each of them with a CancellablePromise
 */
export function CancellablePromiseRunFactories<TTuple extends TCancellablePromiseFactory<any>[], TStrategy extends TAbortStrategy>(
  constructor: ICancellablePromiseConstructor,
  factories: TTuple,
  signal: IAdvancedAbortSignal,
  options?: ICancellablePromiseOptions<TPromiseOrValueTupleToValueUnion<TTuple>, TStrategy>
): TPromiseOrValueTupleToCancellablePromiseTuple<TTuple> {
  return factories.map((factory: TCancellablePromiseFactory<any>) => {
    return CancellablePromiseTry<TPromiseOrValueFactoryTupleToValueUnion<TTuple>, TStrategy>(constructor, factory, signal, options);
  }) as unknown as TPromiseOrValueTupleToCancellablePromiseTuple<TTuple>;
}

/**
 * Aborts 'controller' as soon as 'promise' is resolved (fulfilled or rejected)
 */
export function AbortControllerWhenPromiseResolved<TPromise extends Promise<any>>(
  promise: TPromise,
  controller: IAdvancedAbortController,
  getReason: () => any
): TPromise {
  return promise
    .then(
      ...Finally<TPromiseType<TPromise>>(() => {
        if (!controller.signal.aborted) {
          controller.abort(getReason());
        }
      })
    ) as TPromise;
}
